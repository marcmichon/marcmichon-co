import type { IocType } from '../../types/ioc';

/**
 * Définition d'un motif utilisé par le moteur d'extraction.
 *
 * Ce fichier contient uniquement les expressions régulières permettant
 * d'identifier des candidats IOC dans un texte déjà refangé.
 *
 * La validation métier sera réalisée séparément dans validators.ts.
 */
export interface IocPatternDefinition {
  /**
   * Type d'IOC produit par le motif.
   */
  type: IocType;

  /**
   * Source brute de l'expression régulière.
   *
   * On stocke la source plutôt qu'une instance RegExp globale afin
   * d'éviter les effets de bord liés à la propriété RegExp.lastIndex.
   */
  source: string;

  /**
   * Drapeaux utilisés lors de la création de l'expression régulière.
   */
  flags: string;

  /**
   * Ordre d'exécution du motif.
   *
   * Les types les plus spécifiques doivent être analysés avant
   * les types génériques.
   */
  priority: number;

  /**
   * Description utile pour la documentation et le debug.
   */
  description: string;
}

/**
 * Fragment représentant un octet IPv4 compris entre 0 et 255.
 */
const IPV4_OCTET =
  String.raw`(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)`;

/**
 * Adresse IPv4 complète.
 *
 * Exemples reconnus :
 *
 * - 8.8.8.8
 * - 192.168.1.10
 * - 255.255.255.255
 *
 * Exemples rejetés :
 *
 * - 999.1.1.1
 * - 256.10.10.10
 */
const IPV4_SOURCE =
  String.raw`\b(?:${IPV4_OCTET}\.){3}${IPV4_OCTET}\b`;

/**
 * Adresse IPv6.
 *
 * Le motif couvre :
 *
 * - les formes complètes ;
 * - les formes compressées avec "::" ;
 * - les adresses IPv4 encapsulées ;
 * - les adresses link-local avec identifiant de zone.
 *
 * La validation finale sera tout de même effectuée dans validators.ts.
 */
const IPV6_SOURCE = String.raw`(?<![A-Fa-f0-9:])(?:` +
  String.raw`(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}|` +
  String.raw`(?:[A-Fa-f0-9]{1,4}:){1,7}:|` +
  String.raw`(?:[A-Fa-f0-9]{1,4}:){1,6}:[A-Fa-f0-9]{1,4}|` +
  String.raw`(?:[A-Fa-f0-9]{1,4}:){1,5}(?::[A-Fa-f0-9]{1,4}){1,2}|` +
  String.raw`(?:[A-Fa-f0-9]{1,4}:){1,4}(?::[A-Fa-f0-9]{1,4}){1,3}|` +
  String.raw`(?:[A-Fa-f0-9]{1,4}:){1,3}(?::[A-Fa-f0-9]{1,4}){1,4}|` +
  String.raw`(?:[A-Fa-f0-9]{1,4}:){1,2}(?::[A-Fa-f0-9]{1,4}){1,5}|` +
  String.raw`[A-Fa-f0-9]{1,4}:(?:(?::[A-Fa-f0-9]{1,4}){1,6})|` +
  String.raw`:(?:(?::[A-Fa-f0-9]{1,4}){1,7}|:)|` +
  String.raw`fe80:(?::[A-Fa-f0-9]{0,4}){0,4}%[A-Za-z0-9._~-]+|` +
  String.raw`::(?:ffff(?::0{1,4})?:)?(?:${IPV4_OCTET}\.){3}${IPV4_OCTET}|` +
  String.raw`(?:[A-Fa-f0-9]{1,4}:){1,4}:(?:${IPV4_OCTET}\.){3}${IPV4_OCTET}` +
  String.raw`)(?![A-Fa-f0-9:])`;

/**
 * Label DNS individuel.
 *
 * Un label :
 *
 * - commence par un caractère alphanumérique ;
 * - peut contenir des tirets ;
 * - se termine par un caractère alphanumérique ;
 * - mesure au maximum 63 caractères.
 */
const DOMAIN_LABEL =
  String.raw`[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?`;

/**
 * Domaine DNS complet.
 *
 * La longueur globale maximale de 253 caractères sera vérifiée
 * dans validators.ts, car cette contrainte est peu lisible en regex.
 *
 * Ce motif reconnaît notamment :
 *
 * - example.com
 * - subdomain.example.org
 * - api.security.example.co.uk
 */
const DOMAIN_SOURCE =
  String.raw`\b(?:${DOMAIN_LABEL}\.)+[A-Z]{2,63}\b`;

/**
 * Adresse email classique.
 *
 * Le motif sert à extraire des candidats réalistes dans des rapports,
 * tickets, journaux et alertes de sécurité.
 *
 * Il ne cherche volontairement pas à implémenter l'intégralité de la
 * RFC 5322, qui autorise des formes très rares et peu pertinentes ici.
 */
const EMAIL_SOURCE =
  String.raw`\b[A-Z0-9.!#$%&'*+/=?^_` +
  String.raw`{|}~-]+@(?:${DOMAIN_LABEL}\.)+[A-Z]{2,63}\b`;

/**
 * URL HTTP ou HTTPS.
 *
 * Le motif s'arrête sur :
 *
 * - un espace ;
 * - une tabulation ou un retour à la ligne ;
 * - une balise HTML ;
 * - un guillemet simple ou double ;
 * - certains caractères de délimitation Markdown.
 *
 * Le nettoyage des caractères de ponctuation finaux sera réalisé
 * pendant la normalisation.
 */
const URL_SOURCE =
  '\\bhttps?:\\/\\/[^\\s<>"\'`\\]\\[{}|\\\\^]+';

/**
 * Empreinte MD5 : 128 bits, représentés par 32 caractères hexadécimaux.
 */
const MD5_SOURCE =
  String.raw`\b[A-F0-9]{32}\b`;

/**
 * Empreinte SHA-1 : 160 bits, représentés par 40 caractères hexadécimaux.
 */
const SHA1_SOURCE =
  String.raw`\b[A-F0-9]{40}\b`;

/**
 * Empreinte SHA-256 : 256 bits, représentés par 64 caractères hexadécimaux.
 */
const SHA256_SOURCE =
  String.raw`\b[A-F0-9]{64}\b`;

/**
 * Empreinte SHA-512 : 512 bits, représentés par 128 caractères hexadécimaux.
 */
const SHA512_SOURCE =
  String.raw`\b[A-F0-9]{128}\b`;

/**
 * Catalogue complet des motifs d'extraction.
 *
 * L'ordre est important :
 *
 * 1. les URL sont extraites avant les domaines ;
 * 2. les emails sont extraits avant les domaines ;
 * 3. les hashes les plus longs sont analysés en premier ;
 * 4. les types génériques arrivent en dernier.
 *
 * Le futur moteur pourra ainsi gérer les chevauchements et éviter
 * d'extraire plusieurs fois une sous-partie du même indicateur.
 */
export const IOC_PATTERN_DEFINITIONS = [
  {
    type: 'URL',
    source: URL_SOURCE,
    flags: 'gi',
    priority: 10,
    description: 'URL utilisant le protocole HTTP ou HTTPS.',
  },
  {
    type: 'Email',
    source: EMAIL_SOURCE,
    flags: 'gi',
    priority: 20,
    description: 'Adresse email avec domaine DNS.',
  },
  {
    type: 'SHA-512',
    source: SHA512_SOURCE,
    flags: 'gi',
    priority: 30,
    description: 'Empreinte cryptographique SHA-512.',
  },
  {
    type: 'SHA-256',
    source: SHA256_SOURCE,
    flags: 'gi',
    priority: 40,
    description: 'Empreinte cryptographique SHA-256.',
  },
  {
    type: 'SHA-1',
    source: SHA1_SOURCE,
    flags: 'gi',
    priority: 50,
    description: 'Empreinte cryptographique SHA-1.',
  },
  {
    type: 'MD5',
    source: MD5_SOURCE,
    flags: 'gi',
    priority: 60,
    description: 'Empreinte cryptographique MD5.',
  },
  {
    type: 'IPv4',
    source: IPV4_SOURCE,
    flags: 'g',
    priority: 70,
    description: 'Adresse IPv4 valide syntaxiquement.',
  },
  {
    type: 'IPv6',
    source: IPV6_SOURCE,
    flags: 'g',
    priority: 80,
    description: 'Adresse IPv6 complète ou compressée.',
  },
  {
    type: 'Domain',
    source: DOMAIN_SOURCE,
    flags: 'gi',
    priority: 90,
    description: 'Nom de domaine DNS pleinement qualifié.',
  },
] as const satisfies readonly IocPatternDefinition[];

/**
 * Types disposant actuellement d'un motif d'extraction.
 */
export type ExtractableIocType =
  (typeof IOC_PATTERN_DEFINITIONS)[number]['type'];

/**
 * Retourne les définitions triées selon leur priorité.
 *
 * Une nouvelle copie est retournée afin d'empêcher un appelant
 * de modifier l'ordre du catalogue original.
 */
export function getOrderedIocPatternDefinitions(): IocPatternDefinition[] {
  return [...IOC_PATTERN_DEFINITIONS].sort(
    (first, second) => first.priority - second.priority,
  );
}

/**
 * Crée une nouvelle instance de RegExp depuis une définition.
 *
 * Cette fonction évite de partager une expression régulière globale
 * entre plusieurs analyses. Une RegExp utilisant le drapeau "g"
 * conserve en effet son dernier index de lecture dans `lastIndex`.
 */
export function createIocPattern(
  definition: IocPatternDefinition,
): RegExp {
  return new RegExp(definition.source, definition.flags);
}

/**
 * Crée l'expression régulière correspondant à un type d'IOC.
 *
 * @throws Error si le type demandé ne possède pas de motif.
 */
export function getIocPattern(type: IocType): RegExp {
  const definition = IOC_PATTERN_DEFINITIONS.find(
    (candidate) => candidate.type === type,
  );

  if (!definition) {
    throw new Error(
      `Aucun motif d'extraction n'est défini pour le type IOC "${type}".`,
    );
  }

  return createIocPattern(definition);
}

/**
 * Teste une valeur avec le motif d'extraction d'un type donné.
 *
 * Attention :
 * cette fonction effectue uniquement un contrôle syntaxique initial.
 * La validation stricte sera confiée à validators.ts.
 */
export function matchesIocPattern(
  type: IocType,
  value: string,
): boolean {
  const pattern = getIocPattern(type);

  /*
   * Les motifs sont conçus pour rechercher une valeur dans un texte.
   * On vérifie ici que la correspondance couvre la totalité de la valeur.
   */
  const match = pattern.exec(value);

  return Boolean(
    match &&
    match.index === 0 &&
    match[0].length === value.length,
  );
}