import type {
  IocAnalysisResult,
  IocItem,
  IocType,
} from '../../types/ioc';

/**
 * Formats d'export pris en charge par le IOC Analyzer.
 */
export type IocExportFormat =
  | 'json'
  | 'csv'
  | 'txt';

/**
 * Mode de représentation des IOC dans les exports.
 *
 * normalized :
 *   Valeur canonique exploitable par les outils de sécurité.
 *
 * defanged :
 *   Valeur neutralisée pour un partage humain plus sûr.
 *
 * raw :
 *   Valeur telle qu'elle apparaissait dans le contenu analysé.
 */
export type IocExportValueMode =
  | 'normalized'
  | 'defanged'
  | 'raw';

/**
 * Options communes aux différents formats d'export.
 */
export interface IocSerializationOptions {
  /**
   * Représentation utilisée pour la valeur principale.
   */
  valueMode?: IocExportValueMode;

  /**
   * Inclut le contexte d'apparition de chaque IOC.
   */
  includeContext?: boolean;

  /**
   * Inclut les métadonnées techniques.
   */
  includeMetadata?: boolean;

  /**
   * Inclut les recommandations d'investigation.
   */
  includeRecommendations?: boolean;

  /**
   * Inclut les IOC dérivés, par exemple les domaines
   * extraits depuis les URL.
   */
  includeExtractedIndicators?: boolean;

  /**
   * Types d'IOC à inclure.
   *
   * Lorsque cette propriété est absente ou vide,
   * tous les types sont exportés.
   */
  includedTypes?: readonly IocType[];

  /**
   * Indentation utilisée pour l'export JSON.
   */
  jsonIndentation?: number;
}

/**
 * Options finales appliquées lorsque l'appelant
 * ne fournit pas de configuration spécifique.
 */
export const DEFAULT_IOC_SERIALIZATION_OPTIONS = {
  valueMode: 'normalized',
  includeContext: true,
  includeMetadata: true,
  includeRecommendations: true,
  includeExtractedIndicators: true,
  includedTypes: [],
  jsonIndentation: 2,
} as const satisfies Required<IocSerializationOptions>;

/**
 * Résultat prêt à être téléchargé.
 */
export interface SerializedIocReport {
  format: IocExportFormat;
  filename: string;
  mimeType: string;
  content: string;
}

/**
 * Structure stable de l'export JSON.
 *
 * Elle est volontairement indépendante de la structure interne
 * exacte de l'interface afin de préserver la compatibilité
 * des exports lors des futures évolutions visuelles.
 */
export interface IocJsonExport {
  schemaVersion: string;
  report: {
    id: string;
    generatedAt: string;
    toolVersion: string;
    hash: string;
    processingMode: string;
    classification: string;
  };
  summary: {
    totalIndicators: number;
    detectedTypes: number;
    duplicatesRemoved: number;
    ignoredCandidates: number;
    normalizedIndicators: number;
    privateIpAddresses: number;
    extractedDomains: number;
  };
  assessment: IocAnalysisResult['assessment'];
  typeCounts: IocAnalysisResult['typeCounts'];
  indicators: IocJsonIndicator[];
  recommendations?: IocAnalysisResult['recommendations'];
}

/**
 * Structure d'un IOC dans l'export JSON.
 */
export interface IocJsonIndicator {
  id: string;
  type: IocType;
  value: string;
  normalizedValue: string;
  defangedValue: string;
  rawValue: string;
  status: IocItem['status'];
  origin: IocItem['origin'];
  occurrences: number;
  firstIndex: number;
  context?: string;
  metadata?: IocItem['metadata'];
}

/**
 * Résout les options finales de sérialisation.
 */
function resolveSerializationOptions(
  options?: IocSerializationOptions,
): Required<IocSerializationOptions> {
  return {
    ...DEFAULT_IOC_SERIALIZATION_OPTIONS,
    ...options,
    includedTypes:
      options?.includedTypes ??
      DEFAULT_IOC_SERIALIZATION_OPTIONS.includedTypes,
  };
}

/**
 * Retourne la valeur d'un IOC selon le mode sélectionné.
 */
export function getIocExportValue(
  item: IocItem,
  mode: IocExportValueMode,
): string {
  switch (mode) {
    case 'raw':
      return item.rawValue;

    case 'defanged':
      return item.defangedValue;

    case 'normalized':
    default:
      return item.value;
  }
}

/**
 * Vérifie si un IOC doit être inclus dans l'export.
 */
function shouldIncludeItem(
  item: IocItem,
  options: Required<IocSerializationOptions>,
): boolean {
  if (
    !options.includeExtractedIndicators &&
    item.origin === 'extracted'
  ) {
    return false;
  }

  if (
    options.includedTypes.length > 0 &&
    !options.includedTypes.includes(item.type)
  ) {
    return false;
  }

  return true;
}

/**
 * Retourne les IOC correspondant aux options d'export.
 */
export function filterIocItemsForExport(
  items: readonly IocItem[],
  options?: IocSerializationOptions,
): IocItem[] {
  const resolvedOptions =
    resolveSerializationOptions(options);

  return items.filter((item) =>
    shouldIncludeItem(item, resolvedOptions),
  );
}

/**
 * Convertit une valeur inconnue en chaîne exploitable
 * dans un export texte ou CSV.
 */
function stringifyMetadataValue(
  value: unknown,
): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Nettoie les retours à la ligne pour les formats tabulaires.
 */
function flattenText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Protège une cellule CSV.
 *
 * Une cellule est entourée de guillemets lorsque nécessaire.
 * Les guillemets internes sont doublés conformément au format CSV.
 */
export function escapeCsvCell(
  value: unknown,
  delimiter = ';',
): string {
  const stringValue = stringifyMetadataValue(value);

  const mustBeQuoted =
    stringValue.includes(delimiter) ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r');

  if (!mustBeQuoted) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

/**
 * Construit une ligne CSV.
 */
function createCsvRow(
  values: readonly unknown[],
  delimiter: string,
): string {
  return values
    .map((value) =>
      escapeCsvCell(value, delimiter),
    )
    .join(delimiter);
}

/**
 * Protège les valeurs CSV contre l'interprétation automatique
 * de formules par certains tableurs.
 *
 * Cette mesure concerne principalement :
 *
 * - les emails commençant par "=" ;
 * - les valeurs commençant par "+", "-", "@" ;
 * - les contenus copiés depuis une source non maîtrisée.
 */
export function protectCsvFormula(
  value: string,
): string {
  const trimmedStart = value.trimStart();

  if (/^[=+\-@]/.test(trimmedStart)) {
    return `'${value}`;
  }

  return value;
}

/**
 * Construit l'objet stable utilisé par l'export JSON.
 */
export function createIocJsonExport(
  result: IocAnalysisResult,
  options?: IocSerializationOptions,
): IocJsonExport {
  const resolvedOptions =
    resolveSerializationOptions(options);

  const items = filterIocItemsForExport(
    result.items,
    resolvedOptions,
  );

  const indicators: IocJsonIndicator[] =
    items.map((item) => {
      const indicator: IocJsonIndicator = {
        id: item.id,
        type: item.type,
        value: getIocExportValue(
          item,
          resolvedOptions.valueMode,
        ),
        normalizedValue: item.value,
        defangedValue: item.defangedValue,
        rawValue: item.rawValue,
        status: item.status,
        origin: item.origin,
        occurrences: item.occurrences,
        firstIndex: item.firstIndex,
      };

      if (resolvedOptions.includeContext) {
        indicator.context = item.context;
      }

      if (resolvedOptions.includeMetadata) {
        indicator.metadata = item.metadata;
      }

      return indicator;
    });

  const exportData: IocJsonExport = {
    schemaVersion: '1.0',
    report: {
      id: result.metadata.reportId,
      generatedAt: result.metadata.generatedAt,
      toolVersion: result.metadata.toolVersion,
      hash: result.metadata.reportHash,
      processingMode:
        result.metadata.processingMode,
      classification:
        result.metadata.classification,
    },
    summary: {
      totalIndicators: indicators.length,
      detectedTypes:
        new Set(
          indicators.map(
            (indicator) => indicator.type,
          ),
        ).size,
      duplicatesRemoved:
        result.metrics.duplicatesRemoved,
      ignoredCandidates:
        result.metrics.ignored,
      normalizedIndicators:
        result.metrics.normalized,
      privateIpAddresses:
        result.metrics.privateIps,
      extractedDomains:
        indicators.filter(
          (indicator) =>
            indicator.type === 'Domain' &&
            indicator.origin === 'extracted',
        ).length,
    },
    assessment: result.assessment,
    typeCounts: createFilteredTypeCounts(
      items,
    ),
    indicators,
  };

  if (
    resolvedOptions.includeRecommendations
  ) {
    exportData.recommendations =
      result.recommendations;
  }

  return exportData;
}

/**
 * Recalcule les compteurs par type après filtrage.
 */
function createFilteredTypeCounts(
  items: readonly IocItem[],
): IocAnalysisResult['typeCounts'] {
  const counts: IocAnalysisResult['typeCounts'] =
    {};

  for (const item of items) {
    counts[item.type] =
      (counts[item.type] ?? 0) + 1;
  }

  return counts;
}

/**
 * Sérialise un rapport au format JSON.
 */
export function serializeIocReportToJson(
  result: IocAnalysisResult,
  options?: IocSerializationOptions,
): string {
  const resolvedOptions =
    resolveSerializationOptions(options);

  const exportData = createIocJsonExport(
    result,
    resolvedOptions,
  );

  return JSON.stringify(
    exportData,
    null,
    resolvedOptions.jsonIndentation,
  );
}

/**
 * Sérialise un rapport au format CSV.
 *
 * Le séparateur par défaut est le point-virgule,
 * mieux adapté à Excel avec une locale française.
 */
export function serializeIocReportToCsv(
  result: IocAnalysisResult,
  options?: IocSerializationOptions,
  delimiter = ';',
): string {
  const resolvedOptions =
    resolveSerializationOptions(options);

  const items = filterIocItemsForExport(
    result.items,
    resolvedOptions,
  );

  const headers = [
    'Report ID',
    'IOC ID',
    'Type',
    'Value',
    'Normalized Value',
    'Defanged Value',
    'Raw Value',
    'Status',
    'Origin',
    'Occurrences',
    'First Index',
    'Context',
    'Metadata',
  ];

  const rows = [
    createCsvRow(headers, delimiter),
  ];

  for (const item of items) {
    const selectedValue = protectCsvFormula(
      getIocExportValue(
        item,
        resolvedOptions.valueMode,
      ),
    );

    const normalizedValue = protectCsvFormula(
      item.value,
    );

    const defangedValue = protectCsvFormula(
      item.defangedValue,
    );

    const rawValue = protectCsvFormula(
      item.rawValue,
    );

    rows.push(
      createCsvRow(
        [
          result.metadata.reportId,
          item.id,
          item.type,
          selectedValue,
          normalizedValue,
          defangedValue,
          rawValue,
          item.status,
          item.origin,
          item.occurrences,
          item.firstIndex,
          resolvedOptions.includeContext
            ? flattenText(item.context)
            : '',
          resolvedOptions.includeMetadata
            ? JSON.stringify(item.metadata)
            : '',
        ],
        delimiter,
      ),
    );
  }

  /*
   * UTF-8 BOM :
   * améliore la reconnaissance des accents par Excel.
   */
  return `\uFEFF${rows.join('\r\n')}`;
}

/**
 * Ajoute une section texte uniquement lorsqu'elle contient
 * au moins une ligne.
 */
function appendTextSection(
  target: string[],
  title: string,
  lines: readonly string[],
): void {
  if (lines.length === 0) {
    return;
  }

  target.push('');
  target.push(title);
  target.push('-'.repeat(title.length));
  target.push(...lines);
}

/**
 * Sérialise un rapport au format texte.
 *
 * Ce format est pensé pour :
 *
 * - les tickets d'incident ;
 * - les notes SOC ;
 * - les messageries ;
 * - les consoles ;
 * - les copier-coller rapides.
 */
export function serializeIocReportToText(
  result: IocAnalysisResult,
  options?: IocSerializationOptions,
): string {
  const resolvedOptions =
    resolveSerializationOptions(options);

  const items = filterIocItemsForExport(
    result.items,
    resolvedOptions,
  );

  const lines: string[] = [
    'MM IOC ANALYZER',
    '===============',
    '',
    `Report ID: ${result.metadata.reportId}`,
    `Generated at: ${result.metadata.generatedAt}`,
    `Tool version: ${result.metadata.toolVersion}`,
    `Processing mode: ${result.metadata.processingMode}`,
    `Classification: ${result.metadata.classification}`,
    `Report hash: ${result.metadata.reportHash}`,
    '',
    'ASSESSMENT',
    '----------',
    `Title: ${result.assessment.title}`,
    `Priority: ${result.assessment.priorityLabel}`,
    `Decision: ${result.assessment.decision}`,
    `Rationale: ${result.assessment.rationale}`,
    '',
    'SUMMARY',
    '-------',
    `Indicators exported: ${items.length}`,
    `Detected types: ${
      new Set(
        items.map((item) => item.type),
      ).size
    }`,
    `Duplicates removed: ${result.metrics.duplicatesRemoved}`,
    `Ignored candidates: ${result.metrics.ignored}`,
    `Normalized indicators: ${result.metrics.normalized}`,
    `Private IP addresses: ${result.metrics.privateIps}`,
  ];

  const groupedItems = groupItemsByType(items);

  for (const [type, typeItems] of groupedItems) {
    appendTextSection(
      lines,
      `${type.toUpperCase()} (${typeItems.length})`,
      typeItems.flatMap((item) => {
        const indicatorLines = [
          `${getIocExportValue(
            item,
            resolvedOptions.valueMode,
          )}`,
          `  Status: ${item.status}`,
          `  Origin: ${item.origin}`,
          `  Occurrences: ${item.occurrences}`,
        ];

        if (
          resolvedOptions.includeContext &&
          item.context
        ) {
          indicatorLines.push(
            `  Context: ${flattenText(item.context)}`,
          );
        }

        if (
          resolvedOptions.includeMetadata &&
          Object.keys(item.metadata).length > 0
        ) {
          indicatorLines.push(
            `  Metadata: ${JSON.stringify(
              item.metadata,
            )}`,
          );
        }

        indicatorLines.push('');

        return indicatorLines;
      }),
    );
  }

  if (
    resolvedOptions.includeRecommendations
  ) {
    appendTextSection(
      lines,
      'RECOMMENDATIONS',
      result.recommendations.flatMap(
        (recommendation) => [
          `${recommendation.order}. ${recommendation.title}`,
          `   ${recommendation.description}`,
          '',
        ],
      ),
    );
  }

  while (
    lines.length > 0 &&
    lines.at(-1) === ''
  ) {
    lines.pop();
  }

  return `${lines.join('\n')}\n`;
}

/**
 * Regroupe les IOC par type tout en conservant
 * l'ordre d'apparition des types.
 */
function groupItemsByType(
  items: readonly IocItem[],
): Map<IocType, IocItem[]> {
  const groups = new Map<
    IocType,
    IocItem[]
  >();

  for (const item of items) {
    const existing = groups.get(item.type);

    if (existing) {
      existing.push(item);
    } else {
      groups.set(item.type, [item]);
    }
  }

  return groups;
}

/**
 * Nettoie une valeur destinée à être utilisée
 * dans un nom de fichier.
 */
function sanitizeFilenamePart(
  value: string,
): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Produit une date compacte utilisable dans un nom de fichier.
 */
function createFilenameTimestamp(
  generatedAt: string,
): string {
  const date = new Date(generatedAt);

  if (Number.isNaN(date.getTime())) {
    return 'unknown-date';
  }

  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Génère le nom d'un fichier d'export.
 */
export function createIocExportFilename(
  result: IocAnalysisResult,
  format: IocExportFormat,
): string {
  const reportPart = sanitizeFilenamePart(
    result.metadata.reportId,
  );

  const timestamp = createFilenameTimestamp(
    result.metadata.generatedAt,
  ).toLowerCase();

  return [
    'mm-ioc-report',
    reportPart,
    timestamp,
  ]
    .filter(Boolean)
    .join('_')
    .concat(`.${format}`);
}

/**
 * Retourne le type MIME correspondant à un format.
 */
export function getIocExportMimeType(
  format: IocExportFormat,
): string {
  switch (format) {
    case 'json':
      return 'application/json;charset=utf-8';

    case 'csv':
      return 'text/csv;charset=utf-8';

    case 'txt':
      return 'text/plain;charset=utf-8';

    default:
      return 'application/octet-stream';
  }
}

/**
 * Sérialise un rapport dans le format demandé.
 */
export function serializeIocReport(
  result: IocAnalysisResult,
  format: IocExportFormat,
  options?: IocSerializationOptions,
): SerializedIocReport {
  let content: string;

  switch (format) {
    case 'json':
      content = serializeIocReportToJson(
        result,
        options,
      );
      break;

    case 'csv':
      content = serializeIocReportToCsv(
        result,
        options,
      );
      break;

    case 'txt':
      content = serializeIocReportToText(
        result,
        options,
      );
      break;

    default: {
      const exhaustiveCheck: never = format;

      throw new Error(
        `Format d'export non pris en charge : ${exhaustiveCheck}`,
      );
    }
  }

  return {
    format,
    filename: createIocExportFilename(
      result,
      format,
    ),
    mimeType: getIocExportMimeType(format),
    content,
  };
}

/**
 * Crée le Blob correspondant à un export.
 *
 * Cette fonction est destinée au navigateur.
 */
export function createIocExportBlob(
  report: SerializedIocReport,
): Blob {
  return new Blob(
    [report.content],
    {
      type: report.mimeType,
    },
  );
}

/**
 * Déclenche le téléchargement d'un export dans le navigateur.
 *
 * Cette fonction ne doit être appelée qu'à la suite
 * d'une action utilisateur explicite.
 */
export function downloadIocReport(
  result: IocAnalysisResult,
  format: IocExportFormat,
  options?: IocSerializationOptions,
): void {
  if (
    typeof document === 'undefined' ||
    typeof URL === 'undefined'
  ) {
    throw new Error(
      'Le téléchargement direct est uniquement disponible dans un navigateur.',
    );
  }

  const report = serializeIocReport(
    result,
    format,
    options,
  );

  const blob = createIocExportBlob(report);
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = report.filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  /*
   * On laisse au navigateur le temps de démarrer
   * le téléchargement avant de libérer l'URL.
   */
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1_000);
}