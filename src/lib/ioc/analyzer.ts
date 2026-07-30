import type {
  IocAnalysisResult,
  IocAnalyzerOptions,
  IocAssessment,
  IocCandidate,
  IocItem,
  IocMetadata,
  IocPriority,
  IocRecommendation,
  IocReportMetadata,
  IocType,
  IocTypeCounts,
} from '../../types/ioc';

import {
  DEFAULT_IOC_ANALYZER_OPTIONS,
} from '../../types/ioc';

import {
  createIocPattern,
  getOrderedIocPatternDefinitions,
  type IocPatternDefinition,
} from './patterns';

import {
  createIocDeduplicationKey,
  defangIoc,
  normalizeIoc,
  refangIoc,
} from './normalize';

import {
  validateDomain,
  validateIoc,
} from './validators';

/**
 * Version fonctionnelle du moteur IOC.
 *
 * Elle est volontairement indépendante de la version globale du site.
 */
export const IOC_ANALYZER_VERSION = '1.0.0';

/**
 * Nombre maximal d'IOC retournés par une seule analyse.
 *
 * Cette limite évite qu'un très gros contenu copié dans le navigateur
 * ne produise des milliers d'éléments et ne ralentisse l'interface.
 */
export const MAX_IOC_RESULTS = 5_000;

/**
 * Taille maximale recommandée pour le contenu source.
 *
 * Cette limite représente environ deux millions de caractères.
 */
export const MAX_SOURCE_LENGTH = 2_000_000;

/**
 * Motifs de séparation fréquemment présents autour d'un IOC.
 */
const CONTEXT_LINE_BREAK_PATTERN = /\s+/g;

/**
 * Caractères de ponctuation pouvant subsister autour d'une capture.
 */
const CANDIDATE_BOUNDARY_PATTERN =
  /^[\s,;:()[\]{}<>"'`]+|[\s,;()[\]{}<>"'`]+$/g;

/**
 * Candidature IOC enrichie avec son type et sa position.
 *
 * IocCandidate reste volontairement minimal dans src/types/ioc.ts.
 * Cette interface est interne au moteur.
 */
interface TypedIocCandidate extends IocCandidate {
  type: IocType;
  endIndex: number;
  priority: number;
}

/**
 * Candidat validé avant déduplication.
 */
interface ValidatedIocCandidate {
  type: IocType;
  rawValue: string;
  normalizedValue: string;
  defangedValue: string;
  status: IocItem['status'];
  context: string;
  firstIndex: number;
  metadata: IocMetadata;
  wasNormalized: boolean;
}

/**
 * Entrée utilisée pendant la déduplication.
 */
interface DeduplicatedIocEntry extends ValidatedIocCandidate {
  id: string;
  occurrences: number;
  origin: IocItem['origin'];
}

/**
 * Résultat interne de la phase d'extraction.
 */
interface ExtractionResult {
  candidates: TypedIocCandidate[];
  rawDetected: number;
  ignoredOverlaps: number;
}

/**
 * Résultat interne de la phase de validation.
 */
interface ValidationPipelineResult {
  candidates: ValidatedIocCandidate[];
  ignored: number;
  normalized: number;
}

/**
 * Résultat de la déduplication.
 */
interface DeduplicationResult {
  entries: DeduplicatedIocEntry[];
  duplicatesRemoved: number;
}

/**
 * Résultat de l'extraction des domaines contenus dans les URL.
 */
interface ExtractedDomainResult {
  entries: DeduplicatedIocEntry[];
  extractedDomains: number;
}

/**
 * Construit les options finales du moteur.
 */
function resolveAnalyzerOptions(
  options?: IocAnalyzerOptions,
): Required<IocAnalyzerOptions> {
  return {
    ...DEFAULT_IOC_ANALYZER_OPTIONS,
    ...options,
  };
}

/**
 * Nettoie le texte source sans en modifier la longueur.
 *
 * Il est important de préserver les index du texte original afin que
 * le contexte et la première position de chaque IOC restent exacts.
 */
function prepareSourceText(source: string): string {
  return source.replace(/\u0000/g, ' ');
}

/**
 * Produit une version refangée du texte.
 *
 * Attention :
 * la longueur du texte peut changer. Cette version sert uniquement
 * à l'extraction. Le contexte final est reconstruit à partir du texte
 * transformé, afin de conserver des positions cohérentes.
 */
function prepareExtractionText(source: string): string {
  return refangIoc(prepareSourceText(source));
}

/**
 * Supprime les caractères de séparation résiduels autour d'une capture.
 */
function cleanCandidateBoundary(value: string): string {
  return value
    .replace(CANDIDATE_BOUNDARY_PATTERN, '')
    .trim();
}

/**
 * Génère un contexte lisible autour d'un IOC.
 */
function createCandidateContext(
  source: string,
  startIndex: number,
  endIndex: number,
  radius: number,
): string {
  const contextStart = Math.max(0, startIndex - radius);
  const contextEnd = Math.min(
    source.length,
    endIndex + radius,
  );

  const before = source.slice(contextStart, startIndex);
  const indicator = source.slice(startIndex, endIndex);
  const after = source.slice(endIndex, contextEnd);

  const combined = `${before}${indicator}${after}`
    .replace(CONTEXT_LINE_BREAK_PATTERN, ' ')
    .trim();

  const prefix = contextStart > 0 ? '…' : '';
  const suffix = contextEnd < source.length ? '…' : '';

  return `${prefix}${combined}${suffix}`;
}

/**
 * Détermine si deux plages de texte se chevauchent.
 */
function rangesOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
): boolean {
  return (
    firstStart < secondEnd &&
    secondStart < firstEnd
  );
}

/**
 * Vérifie si une nouvelle capture est contenue dans une capture
 * déjà conservée.
 *
 * Exemple :
 *
 * https://malicious.example/payload
 *
 * contient :
 *
 * malicious.example
 *
 * Dans ce cas, l'URL reste une capture directe et le domaine sera
 * éventuellement ajouté ensuite comme IOC dérivé.
 */
function overlapsExistingCandidate(
  candidate: TypedIocCandidate,
  existingCandidates: TypedIocCandidate[],
): boolean {
  return existingCandidates.some((existing) =>
    rangesOverlap(
      candidate.index,
      candidate.endIndex,
      existing.index,
      existing.endIndex,
    ),
  );
}

/**
 * Extrait les candidats IOC à partir d'une définition de motif.
 */
function extractCandidatesForPattern(
  source: string,
  definition: IocPatternDefinition,
  options: Required<IocAnalyzerOptions>,
): TypedIocCandidate[] {
  const pattern = createIocPattern(definition);
  const candidates: TypedIocCandidate[] = [];

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const matchedValue = match[0];
    const matchIndex = match.index;

    /*
     * Protection contre une expression régulière qui retournerait
     * accidentellement une correspondance vide.
     */
    if (!matchedValue) {
      pattern.lastIndex += 1;
      continue;
    }

    const rawValue = cleanCandidateBoundary(matchedValue);

    if (!rawValue) {
      continue;
    }

    const relativeStart = matchedValue.indexOf(rawValue);
    const index = matchIndex + Math.max(0, relativeStart);
    const endIndex = index + rawValue.length;

    candidates.push({
      type: definition.type,
      rawValue,
      normalizedValue: rawValue,
      index,
      endIndex,
      priority: definition.priority,
      context: options.includeContext
        ? createCandidateContext(
            source,
            index,
            endIndex,
            options.contextRadius,
          )
        : '',
    });

    if (candidates.length >= MAX_IOC_RESULTS) {
      break;
    }
  }

  return candidates;
}

/**
 * Extrait tous les candidats en respectant la priorité des motifs.
 *
 * Les URL et emails sont exécutés avant les domaines afin d'éviter
 * que leurs sous-parties soient comptées comme des captures directes.
 */
function extractIocCandidates(
  source: string,
  options: Required<IocAnalyzerOptions>,
): ExtractionResult {
  const acceptedCandidates: TypedIocCandidate[] = [];
  let rawDetected = 0;
  let ignoredOverlaps = 0;

  const definitions =
    getOrderedIocPatternDefinitions();

  for (const definition of definitions) {
    const extracted = extractCandidatesForPattern(
      source,
      definition,
      options,
    );

    rawDetected += extracted.length;

    for (const candidate of extracted) {
      if (
        overlapsExistingCandidate(
          candidate,
          acceptedCandidates,
        )
      ) {
        ignoredOverlaps += 1;
        continue;
      }

      acceptedCandidates.push(candidate);

      if (
        acceptedCandidates.length >=
        MAX_IOC_RESULTS
      ) {
        return {
          candidates: acceptedCandidates,
          rawDetected,
          ignoredOverlaps,
        };
      }
    }
  }

  acceptedCandidates.sort(
    (first, second) =>
      first.index - second.index ||
      first.priority - second.priority,
  );

  return {
    candidates: acceptedCandidates,
    rawDetected,
    ignoredOverlaps,
  };
}

/**
 * Normalise et valide les candidats extraits.
 */
function validateCandidates(
  candidates: TypedIocCandidate[],
): ValidationPipelineResult {
  const validCandidates: ValidatedIocCandidate[] = [];

  let ignored = 0;
  let normalized = 0;

  for (const candidate of candidates) {
    const normalization = normalizeIoc(
      candidate.type,
      candidate.rawValue,
    );

    const validation = validateIoc(
      candidate.type,
      normalization.normalizedValue,
    );

    if (!validation.valid) {
      ignored += 1;
      continue;
    }

    if (normalization.wasNormalized) {
      normalized += 1;
    }

    validCandidates.push({
      type: candidate.type,
      rawValue: candidate.rawValue,
      normalizedValue:
        validation.normalizedValue,
      defangedValue: defangIoc(
        candidate.type,
        validation.normalizedValue,
      ),
      status: validation.status,
      context: candidate.context,
      firstIndex: candidate.index,
      metadata: validation.metadata,
      wasNormalized:
        normalization.wasNormalized,
    });
  }

  return {
    candidates: validCandidates,
    ignored,
    normalized,
  };
}

/**
 * Génère un identifiant stable et lisible pour l'interface.
 *
 * L'identifiant n'est pas une empreinte de sécurité.
 * Il sert uniquement aux actions du tableau :
 *
 * - copier ;
 * - defang ;
 * - supprimer ;
 * - sélectionner.
 */
function createItemId(
  type: IocType,
  value: string,
  sequence: number,
): string {
  const typeSlug = type
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let hash = 2166136261;

  const input = `${type}:${value}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);

    hash = Math.imul(hash, 16777619);
  }

  const hashPart = (hash >>> 0)
    .toString(16)
    .padStart(8, '0');

  return `ioc-${typeSlug}-${hashPart}-${sequence}`;
}

/**
 * Déduplique les IOC à partir de leur valeur normalisée.
 */
function deduplicateCandidates(
  candidates: ValidatedIocCandidate[],
  options: Required<IocAnalyzerOptions>,
): DeduplicationResult {
  const entriesByKey = new Map<
    string,
    DeduplicatedIocEntry
  >();

  let duplicatesRemoved = 0;
  let sequence = 1;

  for (const candidate of candidates) {
    const key = options.caseInsensitiveNetworkIndicators
      ? createIocDeduplicationKey(
          candidate.type,
          candidate.normalizedValue,
        )
      : `${candidate.type}:${candidate.normalizedValue}`;

    const existing = entriesByKey.get(key);

    if (existing) {
      existing.occurrences += 1;
      duplicatesRemoved += 1;

      /*
       * On conserve toujours la première occurrence et son contexte,
       * car elle correspond à l'ordre naturel du contenu source.
       */
      if (
        candidate.firstIndex <
        existing.firstIndex
      ) {
        existing.firstIndex =
          candidate.firstIndex;
        existing.context = candidate.context;
        existing.rawValue =
          candidate.rawValue;
      }

      continue;
    }

    entriesByKey.set(key, {
      id: createItemId(
        candidate.type,
        candidate.normalizedValue,
        sequence,
      ),
      type: candidate.type,
      rawValue: candidate.rawValue,
      normalizedValue:
        candidate.normalizedValue,
      defangedValue:
        candidate.defangedValue,
      status: candidate.status,
      context: candidate.context,
      firstIndex: candidate.firstIndex,
      metadata: candidate.metadata,
      wasNormalized:
        candidate.wasNormalized,
      occurrences: 1,
      origin: 'direct',
    });

    sequence += 1;
  }

  return {
    entries: [...entriesByKey.values()].sort(
      (first, second) =>
        first.firstIndex -
        second.firstIndex,
    ),
    duplicatesRemoved,
  };
}

/**
 * Extrait le domaine contenu dans une URL validée.
 */
function extractDomainFromUrl(
  entry: DeduplicatedIocEntry,
): DeduplicatedIocEntry | null {
  if (entry.type !== 'URL') {
    return null;
  }

  const hostname = entry.metadata.hostname;

  if (!hostname) {
    return null;
  }

  /*
   * Une URL utilisant directement une adresse IP ne produit pas
   * un IOC supplémentaire de type Domain.
   */
  if (
    entry.metadata.version === 4 ||
    entry.metadata.version === 6
  ) {
    return null;
  }

  const validation =
    validateDomain(hostname);

  if (!validation.valid) {
    return null;
  }

  return {
    id: '',
    type: 'Domain',
    rawValue: hostname,
    normalizedValue:
      validation.normalizedValue,
    defangedValue: defangIoc(
      'Domain',
      validation.normalizedValue,
    ),
    status: validation.status,
    context: entry.context,
    firstIndex: entry.firstIndex,
    metadata: {
      ...validation.metadata,
      extracted: true,
      extractedFrom: 'URL',
      sourceValue:
        entry.normalizedValue,
    },
    wasNormalized:
      hostname !== validation.normalizedValue,
    occurrences: entry.occurrences,
    origin: 'extracted',
  };
}

/**
 * Ajoute les domaines dérivés des URL sans dupliquer les domaines
 * déjà détectés directement dans le texte.
 */
function addExtractedDomains(
  existingEntries: DeduplicatedIocEntry[],
  options: Required<IocAnalyzerOptions>,
): ExtractedDomainResult {
  if (!options.extractDomainsFromUrls) {
    return {
      entries: existingEntries,
      extractedDomains: 0,
    };
  }

  const entries = [...existingEntries];
  const existingKeys = new Set(
    entries.map((entry) =>
      createIocDeduplicationKey(
        entry.type,
        entry.normalizedValue,
      ),
    ),
  );

  let extractedDomains = 0;
  let sequence = entries.length + 1;

  for (const entry of existingEntries) {
    const extracted =
      extractDomainFromUrl(entry);

    if (!extracted) {
      continue;
    }

    const key = createIocDeduplicationKey(
      extracted.type,
      extracted.normalizedValue,
    );

    if (existingKeys.has(key)) {
      continue;
    }

    extracted.id = createItemId(
      extracted.type,
      extracted.normalizedValue,
      sequence,
    );

    entries.push(extracted);
    existingKeys.add(key);

    extractedDomains += 1;
    sequence += 1;
  }

  entries.sort(
    (first, second) =>
      first.firstIndex -
        second.firstIndex ||
      (first.origin === 'direct' ? -1 : 1),
  );

  return {
    entries,
    extractedDomains,
  };
}

/**
 * Convertit les entrées internes en IocItem publics.
 */
function createIocItems(
  entries: DeduplicatedIocEntry[],
): IocItem[] {
  return entries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    value: entry.normalizedValue,
    rawValue: entry.rawValue,
    defangedValue:
      entry.defangedValue,
    status: entry.status,
    origin: entry.origin,
    context: entry.context,
    occurrences: entry.occurrences,
    firstIndex: entry.firstIndex,
    metadata: entry.metadata,
  }));
}

/**
 * Calcule le nombre d'IOC par type.
 */
function createTypeCounts(
  items: IocItem[],
): IocTypeCounts {
  const counts: IocTypeCounts = {};

  for (const item of items) {
    counts[item.type] =
      (counts[item.type] ?? 0) + 1;
  }

  return counts;
}

/**
 * Calcule la priorité générale du rapport.
 *
 * Cette priorité ne représente pas une réputation Threat Intelligence.
 * Elle reflète uniquement le potentiel d'exploitation opérationnelle
 * du lot d'IOC détecté.
 */
function calculatePriority(
  items: IocItem[],
): IocPriority {
  if (items.length === 0) {
    return 'informational';
  }

  const publicNetworkIndicators =
    items.filter(
      (item) =>
        (
          item.type === 'IPv4' ||
          item.type === 'IPv6' ||
          item.type === 'Domain' ||
          item.type === 'URL'
        ) &&
        item.status === 'public',
    ).length;

  const hashCount = items.filter(
    (item) =>
      item.type === 'MD5' ||
      item.type === 'SHA-1' ||
      item.type === 'SHA-256' ||
      item.type === 'SHA-512',
  ).length;

  const urlCount = items.filter(
    (item) => item.type === 'URL',
  ).length;

  /*
   * Plusieurs familles complémentaires rendent le rapport
   * immédiatement exploitable pour une investigation.
   */
  const detectedTypes = new Set(
    items.map((item) => item.type),
  ).size;

  if (
    items.length >= 20 ||
    (
      publicNetworkIndicators >= 5 &&
      hashCount >= 2 &&
      urlCount >= 2
    )
  ) {
    return 'critical';
  }

  if (
    items.length >= 8 ||
    publicNetworkIndicators >= 3 ||
    (
      detectedTypes >= 3 &&
      items.length >= 5
    )
  ) {
    return 'high';
  }

  return 'normal';
}

/**
 * Génère l'évaluation opérationnelle du rapport.
 */
function createAssessment(
  items: IocItem[],
): IocAssessment {
  const priority = calculatePriority(items);

  if (items.length === 0) {
    return {
      level: 'no-indicator',
      priority,
      title: 'Aucun indicateur détecté',
      priorityLabel: 'Information',
      decision:
        'Aucun IOC directement exploitable',
      rationale:
        'Le contenu analysé ne contient aucun indicateur valide correspondant aux formats actuellement pris en charge.',
    };
  }

  const publicItems = items.filter(
    (item) => item.status === 'public',
  );

  const actionableItems = items.filter(
    (item) =>
      item.status === 'public' ||
      item.status === 'known',
  );

  if (priority === 'critical') {
    return {
      level: 'priority-investigation',
      priority,
      title: 'Investigation prioritaire',
      priorityLabel: 'Priorité critique',
      decision:
        `${actionableItems.length} IOC potentiellement exploitables`,
      rationale:
        'Le volume et la diversité des indicateurs permettent une investigation immédiate dans les outils de sécurité et les sources de Threat Intelligence.',
    };
  }

  if (priority === 'high') {
    return {
      level: 'investigation-recommended',
      priority,
      title: 'Investigation recommandée',
      priorityLabel: 'Haute priorité',
      decision:
        `${actionableItems.length} IOC exploitables`,
      rationale:
        'Le rapport contient plusieurs indicateurs publics ou techniquement exploitables qui méritent une qualification et une recherche dans la télémétrie.',
    };
  }

  if (publicItems.length > 0) {
    return {
      level: 'investigation-recommended',
      priority,
      title: 'Qualification recommandée',
      priorityLabel: 'Priorité normale',
      decision:
        `${publicItems.length} IOC public${publicItems.length > 1 ? 's' : ''}`,
      rationale:
        'Les indicateurs publics peuvent être recherchés dans les outils de sécurité et enrichis auprès de sources externes.',
    };
  }

  return {
    level: 'to-qualify',
    priority,
    title: 'Indicateurs à qualifier',
    priorityLabel: 'Priorité normale',
    decision:
      `${items.length} IOC détecté${items.length > 1 ? 's' : ''}`,
    rationale:
      'Les indicateurs détectés sont majoritairement internes, réservés ou contextuels. Ils doivent être interprétés dans leur environnement d’origine.',
  };
}

/**
 * Construit une recommandation uniquement si au moins un des types
 * concernés est présent dans le rapport.
 */
function createConditionalRecommendation(
  id: string,
  order: number,
  title: string,
  description: string,
  applicableTypes: IocType[],
  presentTypes: Set<IocType>,
): IocRecommendation | null {
  const isApplicable = applicableTypes.some(
    (type) => presentTypes.has(type),
  );

  if (!isApplicable) {
    return null;
  }

  return {
    id,
    order,
    title,
    description,
    applicableTypes,
  };
}

/**
 * Produit un plan d'investigation adapté au contenu du rapport.
 */
function createRecommendations(
  items: IocItem[],
): IocRecommendation[] {
  if (items.length === 0) {
    return [];
  }

  const presentTypes = new Set(
    items.map((item) => item.type),
  );

  const recommendations: Array<
    IocRecommendation | null
  > = [
    createConditionalRecommendation(
      'search-network-telemetry',
      1,
      'Rechercher dans la télémétrie réseau',
      'Rechercher les adresses IP, domaines et URL dans les journaux DNS, proxy, firewall, NDR et Secure Web Gateway.',
      ['IPv4', 'IPv6', 'Domain', 'URL'],
      presentTypes,
    ),

    createConditionalRecommendation(
      'search-endpoint-telemetry',
      2,
      'Rechercher sur les endpoints',
      'Rechercher les hashes, domaines et URL dans les événements EDR, les processus, les fichiers, les connexions réseau et les lignes de commande.',
      [
        'MD5',
        'SHA-1',
        'SHA-256',
        'SHA-512',
        'Domain',
        'URL',
      ],
      presentTypes,
    ),

    createConditionalRecommendation(
      'enrich-public-indicators',
      3,
      'Enrichir les IOC publics',
      'Vérifier la réputation, la première observation, les relations techniques, les certificats, les résolutions DNS et les éventuelles campagnes associées.',
      [
        'IPv4',
        'IPv6',
        'Domain',
        'URL',
        'MD5',
        'SHA-1',
        'SHA-256',
        'SHA-512',
      ],
      presentTypes,
    ),

    createConditionalRecommendation(
      'review-email-context',
      4,
      'Analyser le contexte email',
      'Vérifier l’expéditeur, les destinataires, les en-têtes, les liens et les pièces jointes associés aux adresses email détectées.',
      ['Email'],
      presentTypes,
    ),

    {
      id: 'preserve-context',
      order: 5,
      title: 'Préserver le contexte initial',
      description:
        'Conserver le message, le journal ou le rapport source afin de corréler chaque IOC avec son contexte d’apparition.',
      applicableTypes: [...presentTypes],
    },
  ];

  return recommendations
    .filter(
      (
        recommendation,
      ): recommendation is IocRecommendation =>
        recommendation !== null,
    )
    .sort(
      (first, second) =>
        first.order - second.order,
    );
}

/**
 * Génère un identifiant de rapport.
 */
function createReportId(
  generatedAt: Date,
): string {
  const timestamp = generatedAt
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()
    .padEnd(6, '0');

  return `MM-IOC-${timestamp}-${randomPart}`;
}

/**
 * Convertit un ArrayBuffer en chaîne hexadécimale.
 */
function arrayBufferToHex(
  buffer: ArrayBuffer,
): string {
  return [...new Uint8Array(buffer)]
    .map((byte) =>
      byte.toString(16).padStart(2, '0'),
    )
    .join('');
}

/**
 * Calcule une empreinte SHA-256.
 *
 * Le navigateur et les runtimes Cloudflare disposent de Web Crypto.
 * Un fallback déterministe est cependant prévu pour les environnements
 * ne proposant pas crypto.subtle.
 */
async function calculateSha256(
  value: string,
): Promise<string> {
  const subtleCrypto =
    globalThis.crypto?.subtle;

  if (subtleCrypto) {
    const encodedValue =
      new TextEncoder().encode(value);

    const digest =
      await subtleCrypto.digest(
        'SHA-256',
        encodedValue,
      );

    return arrayBufferToHex(digest);
  }

  /*
   * Fallback non cryptographique.
   *
   * Il conserve une valeur stable pour le rapport, mais ne doit pas
   * être présenté comme une preuve cryptographique forte.
   */
  let firstHash = 2166136261;
  let secondHash = 0x9e3779b9;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    firstHash ^= code;
    firstHash = Math.imul(
      firstHash,
      16777619,
    );

    secondHash ^= code + index;
    secondHash = Math.imul(
      secondHash,
      2246822519,
    );
  }

  const fallback = [
    firstHash >>> 0,
    secondHash >>> 0,
    (firstHash ^ secondHash) >>> 0,
    Math.imul(
      firstHash,
      secondHash,
    ) >>> 0,
  ]
    .map((part) =>
      part.toString(16).padStart(8, '0'),
    )
    .join('');

  return fallback.padEnd(64, '0');
}

/**
 * Sérialise les informations importantes avant calcul du hash.
 *
 * Le reportId et le reportHash sont volontairement exclus afin
 * que l'empreinte dépende uniquement du contenu analysé.
 */
function createHashPayload(
  source: string,
  items: IocItem[],
  generatedAt: string,
): string {
  return JSON.stringify({
    source,
    generatedAt,
    items: items.map((item) => ({
      type: item.type,
      value: item.value,
      status: item.status,
      origin: item.origin,
      occurrences: item.occurrences,
    })),
  });
}

/**
 * Crée les métadonnées du rapport.
 */
async function createReportMetadata(
  source: string,
  items: IocItem[],
  generatedAt: Date,
): Promise<IocReportMetadata> {
  const generatedAtIso =
    generatedAt.toISOString();

  const reportHash = await calculateSha256(
    createHashPayload(
      source,
      items,
      generatedAtIso,
    ),
  );

  return {
    reportId:
      createReportId(generatedAt),
    generatedAt: generatedAtIso,
    toolVersion:
      IOC_ANALYZER_VERSION,
    reportHash,
    processingMode: 'local',
    classification: 'internal',
  };
}

/**
 * Analyse un texte brut et retourne un rapport IOC complet.
 *
 * Cette fonction constitue le point d'entrée principal du moteur.
 *
 * Elle est asynchrone uniquement parce que le hash du rapport est
 * calculé avec Web Crypto.
 */
export async function analyzeIocText(
  source: string,
  options?: IocAnalyzerOptions,
): Promise<IocAnalysisResult> {
  if (typeof source !== 'string') {
    throw new TypeError(
      'Le contenu à analyser doit être une chaîne de caractères.',
    );
  }

  if (source.length > MAX_SOURCE_LENGTH) {
    throw new RangeError(
      `Le contenu dépasse la taille maximale autorisée de ${MAX_SOURCE_LENGTH.toLocaleString('fr-FR')} caractères.`,
    );
  }

  const resolvedOptions =
    resolveAnalyzerOptions(options);

  const preparedSource =
    prepareExtractionText(source);

  const extraction =
    extractIocCandidates(
      preparedSource,
      resolvedOptions,
    );

  const validation =
    validateCandidates(
      extraction.candidates,
    );

  const deduplication =
    deduplicateCandidates(
      validation.candidates,
      resolvedOptions,
    );

  const domainExtraction =
    addExtractedDomains(
      deduplication.entries,
      resolvedOptions,
    );

  const items = createIocItems(
    domainExtraction.entries,
  );

  const typeCounts =
    createTypeCounts(items);

  const detectedTypes =
    Object.keys(typeCounts).length;

  const privateIps = items.filter(
    (item) =>
      (
        item.type === 'IPv4' ||
        item.type === 'IPv6'
      ) &&
      item.status === 'private',
  ).length;

  const assessment =
    createAssessment(items);

  const recommendations =
    createRecommendations(items);

  const generatedAt = new Date();

  const metadata =
    await createReportMetadata(
      source,
      items,
      generatedAt,
    );

  return {
    source,
    items,
    metrics: {
      rawDetected:
        extraction.rawDetected,
      unique: items.length,
      duplicatesRemoved:
        deduplication.duplicatesRemoved,
      ignored:
        extraction.ignoredOverlaps +
        validation.ignored,
      normalized:
        validation.normalized,
      privateIps,
      extractedDomains:
        domainExtraction.extractedDomains,
      detectedTypes,
    },
    typeCounts,
    assessment,
    recommendations,
    metadata,
  };
}

/**
 * Alias court utilisable dans l'interface.
 */
export const analyzeIocs = analyzeIocText;