import { jsPDF } from 'jspdf';

import type {
  IocAnalysisResult,
  IocItem,
  IocPriority,
  IocRecommendation,
  IocStatus,
  IocType,
} from '../../types/ioc';

import {
  filterIocItemsForExport,
  getIocExportValue,
  type IocExportValueMode,
  type IocSerializationOptions,
} from './serialize';

/**
 * Options spécifiques à la génération du rapport PDF.
 */
export interface IocPdfOptions
  extends Pick<
    IocSerializationOptions,
    | 'includeContext'
    | 'includeMetadata'
    | 'includeRecommendations'
    | 'includeExtractedIndicators'
    | 'includedTypes'
  > {
  /**
   * Valeur principale affichée dans le tableau.
   */
  valueMode?: IocExportValueMode;

  /**
   * Nom de l'analyste ou de l'organisation.
   */
  analystName?: string;

  /**
   * Référence externe facultative :
   * ticket, incident, dossier ou investigation.
   */
  caseReference?: string;

  /**
   * Classification affichée dans le rapport.
   */
  classification?: string;

  /**
   * Ajoute la source brute en annexe.
   *
   * Désactivé par défaut afin d'éviter d'inclure
   * accidentellement des données sensibles.
   */
  includeSourceText?: boolean;

  /**
   * Télécharge automatiquement le PDF.
   *
   * Cette option est uniquement utilisée par generateIocPdf.
   */
  download?: boolean;

  /**
   * Nom de fichier personnalisé.
   */
  filename?: string;
}

/**
 * Résultat produit par le générateur.
 */
export interface GeneratedIocPdf {
  document: jsPDF;
  filename: string;
  blob: Blob;
}

/**
 * Options finales appliquées au rapport.
 */
const DEFAULT_IOC_PDF_OPTIONS = {
  valueMode: 'defanged',
  includeContext: true,
  includeMetadata: false,
  includeRecommendations: true,
  includeExtractedIndicators: true,
  includedTypes: [],
  analystName: '',
  caseReference: '',
  classification: '',
  includeSourceText: false,
  download: false,
  filename: '',
} as const satisfies Required<IocPdfOptions>;

/**
 * Format A4 exprimé en millimètres.
 */
const PAGE = {
  width: 210,
  height: 297,
  marginLeft: 16,
  marginRight: 16,
  marginTop: 16,
  marginBottom: 17,
} as const;

/**
 * Largeur exploitable du document.
 */
const CONTENT_WIDTH =
  PAGE.width -
  PAGE.marginLeft -
  PAGE.marginRight;

/**
 * Palette alignée avec le design sombre du site.
 *
 * Le fond du PDF reste clair afin d'assurer :
 *
 * - une bonne impression ;
 * - une lecture professionnelle ;
 * - une consommation d'encre raisonnable.
 */
const COLORS = {
  navy: [13, 27, 48] as const,
  navySoft: [25, 45, 72] as const,
  blue: [37, 99, 235] as const,
  blueSoft: [232, 240, 254] as const,
  cyan: [8, 145, 178] as const,

  text: [29, 41, 57] as const,
  textSoft: [83, 98, 117] as const,
  textMuted: [119, 133, 151] as const,

  border: [214, 222, 232] as const,
  surface: [246, 248, 251] as const,
  white: [255, 255, 255] as const,

  green: [21, 128, 61] as const,
  greenSoft: [232, 247, 237] as const,

  amber: [180, 83, 9] as const,
  amberSoft: [255, 247, 224] as const,

  red: [185, 28, 28] as const,
  redSoft: [254, 235, 235] as const,

  purple: [109, 40, 217] as const,
  purpleSoft: [243, 232, 255] as const,
} as const;

type PdfColor = readonly [
  number,
  number,
  number,
];

interface PdfContext {
  doc: jsPDF;
  result: IocAnalysisResult;
  items: IocItem[];
  options: Required<IocPdfOptions>;
  cursorY: number;
  pageNumber: number;
}

/**
 * Définit la couleur du texte.
 */
function setTextColor(
  doc: jsPDF,
  color: PdfColor,
): void {
  doc.setTextColor(
    color[0],
    color[1],
    color[2],
  );
}

/**
 * Définit la couleur de remplissage.
 */
function setFillColor(
  doc: jsPDF,
  color: PdfColor,
): void {
  doc.setFillColor(
    color[0],
    color[1],
    color[2],
  );
}

/**
 * Définit la couleur de bordure.
 */
function setDrawColor(
  doc: jsPDF,
  color: PdfColor,
): void {
  doc.setDrawColor(
    color[0],
    color[1],
    color[2],
  );
}

/**
 * Normalise un texte pour le moteur PDF.
 *
 * Les caractères de contrôle sont supprimés afin d'éviter
 * des comportements imprévisibles pendant le rendu.
 */
function sanitizePdfText(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value)
    .replace(/\u0000/g, '')
    .replace(/\t/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();
}

/**
 * Aplatit un texte sur une seule ligne.
 */
function flattenPdfText(
  value: string,
): string {
  return sanitizePdfText(value)
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Tronque une valeur très longue.
 */
function truncateText(
  value: string,
  maximumLength: number,
): string {
  if (value.length <= maximumLength) {
    return value;
  }

  return `${value.slice(
    0,
    Math.max(0, maximumLength - 3),
  )}...`;
}

/**
 * Formate une date ISO en français.
 */
function formatPdfDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      dateStyle: 'long',
      timeStyle: 'medium',
    },
  ).format(date);
}

/**
 * Construit un nom de fichier sûr.
 */
function sanitizeFilename(
  value: string,
): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Crée le nom de fichier par défaut.
 */
function createPdfFilename(
  result: IocAnalysisResult,
): string {
  const reportId = sanitizeFilename(
    result.metadata.reportId,
  );

  return `MM-IOC-Report_${reportId}.pdf`;
}

/**
 * Résout les options finales.
 */
function resolvePdfOptions(
  options?: IocPdfOptions,
): Required<IocPdfOptions> {
  return {
    ...DEFAULT_IOC_PDF_OPTIONS,
    ...options,
    includedTypes:
      options?.includedTypes ??
      DEFAULT_IOC_PDF_OPTIONS.includedTypes,
  };
}

/**
 * Retourne la classification finale.
 */
function getClassification(
  context: PdfContext,
): string {
  return (
    context.options.classification ||
    context.result.metadata.classification ||
    'internal'
  ).toUpperCase();
}

/**
 * Retourne le numéro total de pages.
 */
function getPageCount(
  doc: jsPDF,
): number {
  return doc.getNumberOfPages();
}

/**
 * Dessine le pied de page d'une page.
 */
function drawFooter(
  context: PdfContext,
  pageNumber: number,
  totalPages?: number,
): void {
  const { doc, result } = context;

  const footerY =
    PAGE.height - 10;

  setDrawColor(doc, COLORS.border);
  doc.setLineWidth(0.2);

  doc.line(
    PAGE.marginLeft,
    footerY - 4,
    PAGE.width - PAGE.marginRight,
    footerY - 4,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTextColor(doc, COLORS.textMuted);

  doc.text(
    truncateText(
      result.metadata.reportId,
      42,
    ),
    PAGE.marginLeft,
    footerY,
  );

  const pageLabel = totalPages
    ? `Page ${pageNumber} / ${totalPages}`
    : `Page ${pageNumber}`;

  doc.text(
    pageLabel,
    PAGE.width - PAGE.marginRight,
    footerY,
    {
      align: 'right',
    },
  );
}

/**
 * Ajoute une page standard.
 */
function addPage(
  context: PdfContext,
): void {
  context.doc.addPage();
  context.pageNumber += 1;
  context.cursorY = PAGE.marginTop;

  drawFooter(
    context,
    context.pageNumber,
  );
}

/**
 * Vérifie si une nouvelle page est nécessaire.
 */
function ensureSpace(
  context: PdfContext,
  requiredHeight: number,
): void {
  const maximumY =
    PAGE.height -
    PAGE.marginBottom -
    7;

  if (
    context.cursorY + requiredHeight >
    maximumY
  ) {
    addPage(context);
  }
}

/**
 * Dessine un texte pouvant occuper plusieurs lignes.
 *
 * Retourne la hauteur réellement utilisée.
 */
function drawWrappedText(
  context: PdfContext,
  text: string,
  x: number,
  y: number,
  width: number,
  options?: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
    color?: PdfColor;
    lineHeight?: number;
    align?: 'left' | 'center' | 'right';
  },
): number {
  const {
    doc,
  } = context;

  const fontSize =
    options?.fontSize ?? 9;

  const lineHeight =
    options?.lineHeight ??
    fontSize * 0.42;

  doc.setFont(
    'helvetica',
    options?.fontStyle ?? 'normal',
  );

  doc.setFontSize(fontSize);

  setTextColor(
    doc,
    options?.color ?? COLORS.text,
  );

  const lines = doc.splitTextToSize(
    sanitizePdfText(text),
    width,
  ) as string[];

  doc.text(
    lines,
    x,
    y,
    {
      align: options?.align ?? 'left',
      lineHeightFactor: 1.15,
    },
  );

  return Math.max(
    lineHeight,
    lines.length * lineHeight,
  );
}

/**
 * Dessine un badge arrondi.
 */
function drawBadge(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: {
    background?: PdfColor;
    foreground?: PdfColor;
    fontSize?: number;
    paddingX?: number;
    height?: number;
  },
): number {
  const label =
    sanitizePdfText(text).toUpperCase();

  const fontSize =
    options?.fontSize ?? 7;

  const paddingX =
    options?.paddingX ?? 2.4;

  const height =
    options?.height ?? 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);

  const width =
    doc.getTextWidth(label) +
    paddingX * 2;

  setFillColor(
    doc,
    options?.background ??
      COLORS.blueSoft,
  );

  doc.roundedRect(
    x,
    y,
    width,
    height,
    1.6,
    1.6,
    'F',
  );

  setTextColor(
    doc,
    options?.foreground ??
      COLORS.blue,
  );

  doc.text(
    label,
    x + width / 2,
    y + height / 2 + 0.9,
    {
      align: 'center',
    },
  );

  return width;
}

/**
 * Retourne les couleurs d'une priorité.
 */
function getPriorityColors(
  priority: IocPriority,
): {
  background: PdfColor;
  foreground: PdfColor;
} {
  switch (priority) {
    case 'critical':
      return {
        background: COLORS.redSoft,
        foreground: COLORS.red,
      };

    case 'high':
      return {
        background: COLORS.amberSoft,
        foreground: COLORS.amber,
      };

    case 'normal':
      return {
        background: COLORS.blueSoft,
        foreground: COLORS.blue,
      };

    case 'informational':
    default:
      return {
        background: COLORS.surface,
        foreground: COLORS.textSoft,
      };
  }
}

/**
 * Retourne le libellé d'un statut.
 */
function getStatusLabel(
  status: IocStatus,
): string {
  switch (status) {
    case 'public':
      return 'Public';

    case 'private':
      return 'Privé';

    case 'loopback':
      return 'Loopback';

    case 'link-local':
      return 'Link-local';

    case 'reserved':
      return 'Réservé';

    case 'known':
      return 'Valide';

    case 'unknown':
    default:
      return 'Inconnu';
  }
}

/**
 * Retourne les couleurs d'un statut.
 */
function getStatusColors(
  status: IocStatus,
): {
  background: PdfColor;
  foreground: PdfColor;
} {
  switch (status) {
    case 'public':
      return {
        background: COLORS.greenSoft,
        foreground: COLORS.green,
      };

    case 'private':
    case 'link-local':
    case 'loopback':
      return {
        background: COLORS.blueSoft,
        foreground: COLORS.blue,
      };

    case 'reserved':
      return {
        background: COLORS.amberSoft,
        foreground: COLORS.amber,
      };

    case 'known':
      return {
        background: COLORS.purpleSoft,
        foreground: COLORS.purple,
      };

    case 'unknown':
    default:
      return {
        background: COLORS.surface,
        foreground: COLORS.textSoft,
      };
  }
}

/**
 * Retourne un libellé lisible pour l'origine.
 */
function getOriginLabel(
  item: IocItem,
): string {
  return item.origin === 'extracted'
    ? 'Dérivé'
    : 'Direct';
}

/**
 * Retourne l'ordre d'affichage des familles IOC.
 */
function getTypeOrder(
  type: IocType,
): number {
  const order: Record<IocType, number> = {
    URL: 1,
    Domain: 2,
    Email: 3,
    IPv4: 4,
    IPv6: 5,
    MD5: 6,
    'SHA-1': 7,
    'SHA-256': 8,
    'SHA-512': 9,
  };

  return order[type];
}

/**
 * Regroupe les IOC par type.
 */
function groupItemsByType(
  items: readonly IocItem[],
): Array<{
  type: IocType;
  items: IocItem[];
}> {
  const groups =
    new Map<IocType, IocItem[]>();

  for (const item of items) {
    const group =
      groups.get(item.type);

    if (group) {
      group.push(item);
    } else {
      groups.set(item.type, [item]);
    }
  }

  return [...groups.entries()]
    .map(([type, groupedItems]) => ({
      type,
      items: groupedItems,
    }))
    .sort(
      (first, second) =>
        getTypeOrder(first.type) -
        getTypeOrder(second.type),
    );
}

/**
 * Dessine l'en-tête principal du rapport.
 */
function drawReportHeader(
  context: PdfContext,
): void {
  const {
    doc,
    result,
  } = context;

  setFillColor(doc, COLORS.navy);

  doc.rect(
    0,
    0,
    PAGE.width,
    58,
    'F',
  );

  setFillColor(doc, COLORS.blue);

  doc.roundedRect(
    PAGE.marginLeft,
    14,
    13,
    13,
    2.5,
    2.5,
    'F',
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTextColor(doc, COLORS.white);

  doc.text(
    'MM',
    PAGE.marginLeft + 6.5,
    22.2,
    {
      align: 'center',
    },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);

  doc.text(
    'IOC ANALYSIS REPORT',
    PAGE.marginLeft + 18,
    20.5,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTextColor(doc, [190, 204, 224]);

  doc.text(
    'Extraction, normalisation et qualification technique des indicateurs',
    PAGE.marginLeft + 18,
    26.5,
  );

  const classification =
  getClassification(context);

doc.setFont('helvetica', 'bold');
doc.setFontSize(7);

const classificationWidth =
  doc.getTextWidth(
    classification.toUpperCase(),
  ) + 4.8;

drawBadge(
  doc,
  classification,
  PAGE.width -
    PAGE.marginRight -
    classificationWidth,
  15,
  {
    background: COLORS.blue,
    foreground: COLORS.white,
    fontSize: 7,
  },
);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTextColor(doc, [190, 204, 224]);

  doc.text(
    `Report ID: ${result.metadata.reportId}`,
    PAGE.marginLeft,
    39,
  );

  doc.text(
    `Generated: ${formatPdfDate(
      result.metadata.generatedAt,
    )}`,
    PAGE.marginLeft,
    44.5,
  );

  doc.text(
    `Engine: MM IOC Analyzer ${result.metadata.toolVersion}`,
    PAGE.marginLeft,
    50,
  );

  context.cursorY = 67;

  drawFooter(
    context,
    context.pageNumber,
  );
}

/**
 * Dessine un titre de section.
 */
function drawSectionTitle(
  context: PdfContext,
  title: string,
  subtitle?: string,
): void {
  ensureSpace(
    context,
    subtitle ? 18 : 13,
  );

  const { doc } = context;

  setFillColor(doc, COLORS.blue);

  doc.roundedRect(
    PAGE.marginLeft,
    context.cursorY,
    3,
    8,
    1,
    1,
    'F',
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setTextColor(doc, COLORS.navy);

  doc.text(
    title,
    PAGE.marginLeft + 7,
    context.cursorY + 6,
  );

  context.cursorY += 10;

  if (subtitle) {
    const height = drawWrappedText(
      context,
      subtitle,
      PAGE.marginLeft + 7,
      context.cursorY,
      CONTENT_WIDTH - 7,
      {
        fontSize: 8,
        color: COLORS.textSoft,
        lineHeight: 3.5,
      },
    );

    context.cursorY += height + 3;
  } else {
    context.cursorY += 3;
  }
}

/**
 * Dessine une paire libellé / valeur.
 */
function drawMetadataLine(
  context: PdfContext,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
): number {
  const { doc } = context;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setTextColor(doc, COLORS.textMuted);

  doc.text(
    label.toUpperCase(),
    x,
    y,
  );

  return drawWrappedText(
    context,
    value || '-',
    x,
    y + 5,
    width,
    {
      fontSize: 9,
      color: COLORS.text,
      lineHeight: 4,
    },
  );
}

/**
 * Dessine les informations générales.
 */
function drawReportInformation(
  context: PdfContext,
): void {
  drawSectionTitle(
    context,
    'Informations du rapport',
  );

  const { doc, options, result } =
    context;

  const boxHeight = 32;

  ensureSpace(context, boxHeight + 5);

  setFillColor(doc, COLORS.surface);
  setDrawColor(doc, COLORS.border);
  doc.setLineWidth(0.2);

  doc.roundedRect(
    PAGE.marginLeft,
    context.cursorY,
    CONTENT_WIDTH,
    boxHeight,
    2.5,
    2.5,
    'FD',
  );

  const columnGap = 8;
  const columnWidth =
    (CONTENT_WIDTH -
      columnGap * 2 -
      12) /
    3;

  const startX =
    PAGE.marginLeft + 6;

  drawMetadataLine(
    context,
    'Analyste',
    options.analystName ||
      'Non renseigné',
    startX,
    context.cursorY + 8,
    columnWidth,
  );

  drawMetadataLine(
    context,
    'Référence',
    options.caseReference ||
      'Non renseignée',
    startX +
      columnWidth +
      columnGap,
    context.cursorY + 8,
    columnWidth,
  );

  drawMetadataLine(
    context,
    'Traitement',
    result.metadata.processingMode ===
      'local'
      ? 'Analyse locale'
      : result.metadata.processingMode,
    startX +
      (columnWidth + columnGap) * 2,
    context.cursorY + 8,
    columnWidth,
  );

  context.cursorY += boxHeight + 8;
}

/**
 * Dessine la carte d'évaluation.
 */
function drawAssessment(
  context: PdfContext,
): void {
  drawSectionTitle(
    context,
    'Évaluation opérationnelle',
    'La priorité reflète la richesse opérationnelle du lot. Elle ne constitue pas un verdict de réputation ou de malveillance.',
  );

  const {
    doc,
    result,
  } = context;

  const colors =
    getPriorityColors(
      result.assessment.priority,
    );

  const rationaleLines =
    doc.splitTextToSize(
      sanitizePdfText(
        result.assessment.rationale,
      ),
      CONTENT_WIDTH - 14,
    ) as string[];

  const boxHeight =
    35 +
    Math.max(
      0,
      rationaleLines.length - 1,
    ) *
      3.8;

  ensureSpace(context, boxHeight + 5);

  setFillColor(
    doc,
    colors.background,
  );

  setDrawColor(
    doc,
    colors.foreground,
  );

  doc.setLineWidth(0.35);

  doc.roundedRect(
    PAGE.marginLeft,
    context.cursorY,
    CONTENT_WIDTH,
    boxHeight,
    3,
    3,
    'FD',
  );

  const badgeWidth = drawBadge(
    doc,
    result.assessment.priorityLabel,
    PAGE.marginLeft + 6,
    context.cursorY + 6,
    {
      background: colors.foreground,
      foreground: COLORS.white,
      fontSize: 7,
      height: 6.5,
    },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setTextColor(doc, COLORS.navy);

  doc.text(
    result.assessment.title,
    PAGE.marginLeft +
      badgeWidth +
      11,
    context.cursorY + 11,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTextColor(
    doc,
    colors.foreground,
  );

  doc.text(
    result.assessment.decision,
    PAGE.marginLeft + 6,
    context.cursorY + 21,
  );

  drawWrappedText(
    context,
    result.assessment.rationale,
    PAGE.marginLeft + 6,
    context.cursorY + 28,
    CONTENT_WIDTH - 12,
    {
      fontSize: 8.5,
      color: COLORS.textSoft,
      lineHeight: 3.8,
    },
  );

  context.cursorY +=
    boxHeight + 8;
}

/**
 * Dessine une carte de métrique.
 */
function drawMetricCard(
  context: PdfContext,
  x: number,
  y: number,
  width: number,
  value: string | number,
  label: string,
): void {
  const { doc } = context;

  setFillColor(doc, COLORS.surface);
  setDrawColor(doc, COLORS.border);
  doc.setLineWidth(0.2);

  doc.roundedRect(
    x,
    y,
    width,
    22,
    2.5,
    2.5,
    'FD',
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  setTextColor(doc, COLORS.blue);

  doc.text(
    String(value),
    x + 5,
    y + 9,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTextColor(doc, COLORS.textSoft);

  const labelLines =
    doc.splitTextToSize(
      label,
      width - 10,
    ) as string[];

  doc.text(
    labelLines,
    x + 5,
    y + 15,
    {
      lineHeightFactor: 1.1,
    },
  );
}

/**
 * Dessine les métriques principales.
 */
function drawMetrics(
  context: PdfContext,
): void {
  drawSectionTitle(
    context,
    'Synthèse de l’analyse',
  );

  ensureSpace(context, 54);

  const gap = 4;
  const width =
    (CONTENT_WIDTH - gap * 3) / 4;

  const firstRowY =
    context.cursorY;

  drawMetricCard(
    context,
    PAGE.marginLeft,
    firstRowY,
    width,
    context.items.length,
    'IOC exportés',
  );

  drawMetricCard(
    context,
    PAGE.marginLeft +
      width +
      gap,
    firstRowY,
    width,
    new Set(
      context.items.map(
        (item) => item.type,
      ),
    ).size,
    'Types détectés',
  );

  drawMetricCard(
    context,
    PAGE.marginLeft +
      (width + gap) * 2,
    firstRowY,
    width,
    context.result.metrics
      .duplicatesRemoved,
    'Doublons supprimés',
  );

  drawMetricCard(
    context,
    PAGE.marginLeft +
      (width + gap) * 3,
    firstRowY,
    width,
    context.result.metrics.privateIps,
    'IP privées',
  );

  const secondRowY =
    firstRowY + 27;

  drawMetricCard(
    context,
    PAGE.marginLeft,
    secondRowY,
    width,
    context.result.metrics.normalized,
    'IOC normalisés',
  );

  drawMetricCard(
    context,
    PAGE.marginLeft +
      width +
      gap,
    secondRowY,
    width,
    context.result.metrics
      .extractedDomains,
    'Domaines dérivés',
  );

  drawMetricCard(
    context,
    PAGE.marginLeft +
      (width + gap) * 2,
    secondRowY,
    width,
    context.result.metrics.ignored,
    'Candidats ignorés',
  );

  drawMetricCard(
    context,
    PAGE.marginLeft +
      (width + gap) * 3,
    secondRowY,
    width,
    context.result.metrics.rawDetected,
    'Détections brutes',
  );

  context.cursorY += 55;
}

/**
 * Dessine la répartition par type.
 */
function drawTypeDistribution(
  context: PdfContext,
): void {
  drawSectionTitle(
    context,
    'Répartition des indicateurs',
  );

  const groups =
    groupItemsByType(context.items);

  if (groups.length === 0) {
    drawWrappedText(
      context,
      'Aucun indicateur à afficher.',
      PAGE.marginLeft,
      context.cursorY,
      CONTENT_WIDTH,
      {
        fontSize: 9,
        color: COLORS.textSoft,
      },
    );

    context.cursorY += 10;
    return;
  }

  const chipGap = 3;
  const rowGap = 3;
  const chipHeight = 9;

  let x = PAGE.marginLeft;
  let y = context.cursorY;

  /*
   * On réserve au minimum une ligne complète avant
   * de commencer le rendu des badges.
   */
  ensureSpace(
    context,
    chipHeight + 4,
  );

  /*
   * ensureSpace peut avoir changé de page.
   * Il faut donc repartir du nouveau curseur.
   */
  y = context.cursorY;

  for (const group of groups) {
    const label =
      `${group.type} · ${group.items.length}`;

    context.doc.setFont(
      'helvetica',
      'bold',
    );

    context.doc.setFontSize(8);

    const width =
      context.doc.getTextWidth(label) + 9;

    /*
     * Retour à la ligne si le badge dépasse
     * la largeur disponible.
     */
    if (
      x + width >
      PAGE.width - PAGE.marginRight
    ) {
      x = PAGE.marginLeft;
      y += chipHeight + rowGap;
    }

    /*
     * Si la nouvelle ligne dépasse la page,
     * on crée une page puis on réinitialise
     * réellement x ET y.
     */
    const maximumY =
      PAGE.height -
      PAGE.marginBottom -
      7;

    if (
      y + chipHeight >
      maximumY
    ) {
      addPage(context);

      x = PAGE.marginLeft;
      y = context.cursorY;
    }

    setFillColor(
      context.doc,
      COLORS.blueSoft,
    );

    setDrawColor(
      context.doc,
      COLORS.border,
    );

    context.doc.roundedRect(
      x,
      y,
      width,
      chipHeight,
      2.2,
      2.2,
      'FD',
    );

    setTextColor(
      context.doc,
      COLORS.blue,
    );

    context.doc.text(
      label,
      x + width / 2,
      y + 5.8,
      {
        align: 'center',
      },
    );

    x += width + chipGap;
  }

  context.cursorY =
    y + chipHeight + 8;
}

/**
 * Transforme les métadonnées en texte lisible.
 */
function formatMetadata(
  item: IocItem,
): string {
  const entries = Object.entries(
    item.metadata,
  ).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      value !== '',
  );

  if (entries.length === 0) {
    return '';
  }

  return entries
    .map(([key, value]) => {
      const formattedValue =
        typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);

      return `${key}: ${formattedValue}`;
    })
    .join(' · ');
}

/**
 * Calcule la hauteur nécessaire pour une ligne IOC.
 */
function calculateIocRowHeight(
  context: PdfContext,
  item: IocItem,
): number {
  const {
    doc,
    options,
  } = context;

  const value =
    getIocExportValue(
      item,
      options.valueMode,
    );

  const valueWidth =
    CONTENT_WIDTH - 20;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.2);

  const valueLines =
    doc.splitTextToSize(
      sanitizePdfText(value),
      valueWidth,
    ) as string[];

  let height =
    18 +
    Math.max(
      0,
      valueLines.length - 1,
    ) *
      3.6;

  if (
    options.includeContext &&
    item.context
  ) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    const contextLines =
      doc.splitTextToSize(
        flattenPdfText(item.context),
        CONTENT_WIDTH - 16,
      ) as string[];

    height +=
      7 +
      contextLines.length * 3.2;
  }

  if (
    options.includeMetadata &&
    Object.keys(item.metadata).length > 0
  ) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    const metadataLines =
      doc.splitTextToSize(
        formatMetadata(item),
        CONTENT_WIDTH - 16,
      ) as string[];

    height +=
      5 +
      metadataLines.length * 3;
  }

  return Math.max(22, height);
}

/**
 * Dessine un IOC individuel.
 */
function drawIocItem(
  context: PdfContext,
  item: IocItem,
  sequence: number,
): void {
  const {
    doc,
    options,
  } = context;

  const rowHeight =
    calculateIocRowHeight(
      context,
      item,
    );

  ensureSpace(
    context,
    rowHeight + 3,
  );

  const startY =
    context.cursorY;

  setFillColor(doc, COLORS.white);
  setDrawColor(doc, COLORS.border);
  doc.setLineWidth(0.2);

  doc.roundedRect(
    PAGE.marginLeft,
    startY,
    CONTENT_WIDTH,
    rowHeight,
    2.2,
    2.2,
    'FD',
  );

  setFillColor(doc, COLORS.blueSoft);

  doc.roundedRect(
    PAGE.marginLeft + 4,
    startY + 4,
    10,
    10,
    2,
    2,
    'F',
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setTextColor(doc, COLORS.blue);

  doc.text(
    String(sequence),
    PAGE.marginLeft + 9,
    startY + 10.5,
    {
      align: 'center',
    },
  );

  let badgeX =
    PAGE.marginLeft + 18;

  badgeX +=
    drawBadge(
      doc,
      item.type,
      badgeX,
      startY + 4,
      {
        background: COLORS.navy,
        foreground: COLORS.white,
        fontSize: 6.8,
        height: 6,
      },
    ) + 2;

  const statusColors =
    getStatusColors(item.status);

  badgeX +=
    drawBadge(
      doc,
      getStatusLabel(item.status),
      badgeX,
      startY + 4,
      {
        background:
          statusColors.background,
        foreground:
          statusColors.foreground,
        fontSize: 6.5,
        height: 6,
      },
    ) + 2;

  badgeX +=
    drawBadge(
      doc,
      getOriginLabel(item),
      badgeX,
      startY + 4,
      {
        background: COLORS.surface,
        foreground: COLORS.textSoft,
        fontSize: 6.5,
        height: 6,
      },
    ) + 2;

  if (item.occurrences > 1) {
    drawBadge(
      doc,
      `${item.occurrences} occurrences`,
      badgeX,
      startY + 4,
      {
        background: COLORS.purpleSoft,
        foreground: COLORS.purple,
        fontSize: 6.5,
        height: 6,
      },
    );
  }

  const selectedValue =
    getIocExportValue(
      item,
      options.valueMode,
    );

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.2);
  setTextColor(doc, COLORS.text);

  const valueLines =
    doc.splitTextToSize(
      sanitizePdfText(selectedValue),
      CONTENT_WIDTH - 20,
    ) as string[];

  doc.text(
    valueLines,
    PAGE.marginLeft + 18,
    startY + 18,
    {
      lineHeightFactor: 1.12,
    },
  );

  let detailY =
    startY +
    18 +
    valueLines.length * 3.6;

  if (
    options.includeContext &&
    item.context
  ) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    setTextColor(doc, COLORS.textMuted);

    doc.text(
      'CONTEXTE',
      PAGE.marginLeft + 8,
      detailY + 3,
    );

    detailY += 7;

    const contextHeight =
      drawWrappedText(
        context,
        flattenPdfText(item.context),
        PAGE.marginLeft + 8,
        detailY,
        CONTENT_WIDTH - 16,
        {
          fontSize: 7.5,
          color: COLORS.textSoft,
          lineHeight: 3.2,
        },
      );

    detailY += contextHeight;
  }

  if (
    options.includeMetadata &&
    Object.keys(item.metadata).length > 0
  ) {
    detailY += 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    setTextColor(doc, COLORS.textMuted);

    doc.text(
      'MÉTADONNÉES',
      PAGE.marginLeft + 8,
      detailY,
    );

    detailY += 4;

    drawWrappedText(
      context,
      formatMetadata(item),
      PAGE.marginLeft + 8,
      detailY,
      CONTENT_WIDTH - 16,
      {
        fontSize: 7,
        color: COLORS.textSoft,
        lineHeight: 3,
      },
    );
  }

  context.cursorY +=
    rowHeight + 3;
}

/**
 * Dessine la liste complète des IOC.
 */
function drawIndicators(
  context: PdfContext,
): void {
  drawSectionTitle(
    context,
    'Indicateurs détectés',
    `${context.items.length} indicateur${context.items.length > 1 ? 's' : ''} inclus dans ce rapport. Valeurs affichées en mode ${context.options.valueMode}.`,
  );

  if (context.items.length === 0) {
    ensureSpace(context, 26);

    setFillColor(
      context.doc,
      COLORS.surface,
    );

    setDrawColor(
      context.doc,
      COLORS.border,
    );

    context.doc.roundedRect(
      PAGE.marginLeft,
      context.cursorY,
      CONTENT_WIDTH,
      22,
      2.5,
      2.5,
      'FD',
    );

    drawWrappedText(
      context,
      'Aucun indicateur correspondant aux options d’export sélectionnées.',
      PAGE.marginLeft + 6,
      context.cursorY + 9,
      CONTENT_WIDTH - 12,
      {
        fontSize: 9,
        color: COLORS.textSoft,
      },
    );

    context.cursorY += 28;
    return;
  }

  context.items.forEach(
    (item, index) => {
      drawIocItem(
        context,
        item,
        index + 1,
      );
    },
  );
}

/**
 * Dessine une recommandation.
 */
function drawRecommendation(
  context: PdfContext,
  recommendation: IocRecommendation,
): void {
  const {
    doc,
  } = context;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);

  const descriptionLines =
    doc.splitTextToSize(
      sanitizePdfText(
        recommendation.description,
      ),
      CONTENT_WIDTH - 23,
    ) as string[];

  const height =
    Math.max(
      19,
      14 +
        descriptionLines.length *
          3.5,
    );

  ensureSpace(
    context,
    height + 3,
  );

  setFillColor(doc, COLORS.surface);
  setDrawColor(doc, COLORS.border);

  doc.roundedRect(
    PAGE.marginLeft,
    context.cursorY,
    CONTENT_WIDTH,
    height,
    2.5,
    2.5,
    'FD',
  );

  setFillColor(doc, COLORS.blue);

  doc.circle(
    PAGE.marginLeft + 8,
    context.cursorY + 9,
    4,
    'F',
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setTextColor(doc, COLORS.white);

  doc.text(
    String(recommendation.order),
    PAGE.marginLeft + 8,
    context.cursorY + 10,
    {
      align: 'center',
    },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTextColor(doc, COLORS.navy);

  doc.text(
    recommendation.title,
    PAGE.marginLeft + 16,
    context.cursorY + 8,
  );

  drawWrappedText(
    context,
    recommendation.description,
    PAGE.marginLeft + 16,
    context.cursorY + 14,
    CONTENT_WIDTH - 22,
    {
      fontSize: 8.2,
      color: COLORS.textSoft,
      lineHeight: 3.5,
    },
  );

  context.cursorY +=
    height + 3;
}

/**
 * Dessine le plan d'investigation.
 */
function drawRecommendations(
  context: PdfContext,
): void {
  if (
    !context.options
      .includeRecommendations
  ) {
    return;
  }

  drawSectionTitle(
    context,
    'Plan d’investigation recommandé',
    'Actions génériques à adapter au contexte, aux outils disponibles et aux procédures de l’organisation.',
  );

  if (
    context.result.recommendations
      .length === 0
  ) {
    drawWrappedText(
      context,
      'Aucune recommandation générée.',
      PAGE.marginLeft,
      context.cursorY,
      CONTENT_WIDTH,
      {
        fontSize: 9,
        color: COLORS.textSoft,
      },
    );

    context.cursorY += 10;
    return;
  }

  for (
    const recommendation of
    context.result.recommendations
  ) {
    drawRecommendation(
      context,
      recommendation,
    );
  }

  context.cursorY += 4;
}

/**
 * Dessine les informations d'intégrité.
 */
function drawIntegrity(
  context: PdfContext,
): void {
  drawSectionTitle(
    context,
    'Traçabilité et intégrité',
  );

  const {
    doc,
    result,
  } = context;

  const boxHeight = 37;

  ensureSpace(
    context,
    boxHeight + 4,
  );

  setFillColor(doc, COLORS.navy);
  doc.roundedRect(
    PAGE.marginLeft,
    context.cursorY,
    CONTENT_WIDTH,
    boxHeight,
    3,
    3,
    'F',
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setTextColor(doc, [190, 204, 224]);

  doc.text(
    'SHA-256 DU RAPPORT',
    PAGE.marginLeft + 6,
    context.cursorY + 8,
  );

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.3);
  setTextColor(doc, COLORS.white);

  const hashLines =
    doc.splitTextToSize(
      result.metadata.reportHash,
      CONTENT_WIDTH - 12,
    ) as string[];

  doc.text(
    hashLines,
    PAGE.marginLeft + 6,
    context.cursorY + 14,
    {
      lineHeightFactor: 1.1,
    },
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  setTextColor(doc, [190, 204, 224]);

  doc.text(
    'Cette empreinte identifie le contenu logique du rapport au moment de sa génération.',
    PAGE.marginLeft + 6,
    context.cursorY + 29,
  );

  context.cursorY +=
    boxHeight + 8;
}

/**
 * Dessine la source brute en annexe.
 */
function drawSourceAppendix(
  context: PdfContext,
): void {
  if (
    !context.options.includeSourceText
  ) {
    return;
  }

  addPage(context);

  drawSectionTitle(
    context,
    'Annexe - Contenu source',
    'Le texte ci-dessous correspond au contenu fourni au moteur avant extraction. Il peut contenir des données sensibles.',
  );

  const source =
    sanitizePdfText(
      context.result.source,
    );

  if (!source) {
    drawWrappedText(
      context,
      'Aucun contenu source disponible.',
      PAGE.marginLeft,
      context.cursorY,
      CONTENT_WIDTH,
      {
        fontSize: 8,
        color: COLORS.textSoft,
      },
    );

    return;
  }

  const paragraphs =
    source.split('\n');

  for (const paragraph of paragraphs) {
    const value =
      paragraph || ' ';

    context.doc.setFont(
      'courier',
      'normal',
    );

    context.doc.setFontSize(7.3);

    const lines =
      context.doc.splitTextToSize(
        value,
        CONTENT_WIDTH,
      ) as string[];

    const requiredHeight =
      Math.max(
        3.3,
        lines.length * 3.3,
      ) + 1.5;

    ensureSpace(
      context,
      requiredHeight,
    );

    context.doc.setFont(
      'courier',
      'normal',
    );

    context.doc.setFontSize(7.3);
    setTextColor(
      context.doc,
      COLORS.text,
    );

    context.doc.text(
      lines,
      PAGE.marginLeft,
      context.cursorY,
      {
        lineHeightFactor: 1.1,
      },
    );

    context.cursorY +=
      requiredHeight;
  }
}

/**
 * Met à jour tous les pieds de page avec le nombre total de pages.
 */
function finalizePageNumbers(
  context: PdfContext,
): void {
  const totalPages =
    getPageCount(context.doc);

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber += 1
  ) {
    context.doc.setPage(pageNumber);

    /*
     * Le fond masque uniquement le précédent numéro de page,
     * sans toucher au trait ni au Report ID.
     */
    setFillColor(
      context.doc,
      COLORS.white,
    );

    context.doc.rect(
      PAGE.width -
        PAGE.marginRight -
        31,
      PAGE.height - 14,
      31,
      7,
      'F',
    );

    context.doc.setFont(
      'helvetica',
      'normal',
    );

    context.doc.setFontSize(7.5);
    setTextColor(
      context.doc,
      COLORS.textMuted,
    );

    context.doc.text(
      `Page ${pageNumber} / ${totalPages}`,
      PAGE.width - PAGE.marginRight,
      PAGE.height - 10,
      {
        align: 'right',
      },
    );
  }
}


/* ==========================================================================
 * IOC PDF V2 - STORY / ENGINEERING REPORT
 * ==========================================================================
 *
 * Le rapport suit le même raisonnement que l'interface :
 *
 * 1. Comprendre
 * 2. Investiguer
 * 3. Examiner les preuves
 * 4. Tracer et archiver
 *
 * Le rendu reste volontairement clair et imprimable. L'identité MM repose
 * sur la hiérarchie, les intitulés et la précision technique plutôt que sur
 * des effets graphiques marketing.
 */

type InvestigationDomain =
  | 'NETWORK'
  | 'ENDPOINT'
  | 'THREAT INTEL'
  | 'VALIDATION';

interface InvestigationStep {
  domain: InvestigationDomain;
  title: string;
  why: string;
  sources: string[];
  expected: string;
}

function getDetectedTypes(
  context: PdfContext,
): IocType[] {
  return [...new Set(
    context.items.map((item) => item.type),
  )];
}

function hasHashIndicator(
  context: PdfContext,
): boolean {
  return context.items.some(
    (item) =>
      item.type === 'MD5' ||
      item.type === 'SHA-1' ||
      item.type === 'SHA-256' ||
      item.type === 'SHA-512',
  );
}

function hasNetworkIndicator(
  context: PdfContext,
): boolean {
  return context.items.some(
    (item) =>
      item.type === 'IPv4' ||
      item.type === 'IPv6' ||
      item.type === 'Domain' ||
      item.type === 'URL',
  );
}

function getObservationLines(
  context: PdfContext,
): string[] {
  const types = getDetectedTypes(context);
  const observations = [
    `${context.items.length} IOC unique${context.items.length > 1 ? 's' : ''} inclus dans le rapport.`,
    `${types.length} famille${types.length > 1 ? 's' : ''} représentée${types.length > 1 ? 's' : ''} : ${types.join(', ') || 'aucune'}.`,
  ];

  if (context.result.metrics.privateIps > 0) {
    observations.push(
      `${context.result.metrics.privateIps} adresse${context.result.metrics.privateIps > 1 ? 's' : ''} IP privée${context.result.metrics.privateIps > 1 ? 's' : ''} à rapprocher de l’inventaire interne.`,
    );
  } else {
    observations.push(
      'Aucune adresse IP privée n’est présente dans le lot exporté.',
    );
  }

  if (context.result.metrics.duplicatesRemoved > 0) {
    observations.push(
      `${context.result.metrics.duplicatesRemoved} doublon${context.result.metrics.duplicatesRemoved > 1 ? 's ont' : ' a'} été supprimé${context.result.metrics.duplicatesRemoved > 1 ? 's' : ''} avant qualification.`,
    );
  } else {
    observations.push(
      'Aucun doublon significatif n’a été conservé dans le rapport.',
    );
  }

  return observations;
}

function getInterpretationText(
  context: PdfContext,
): string {
  const hasUrl = context.items.some(
    (item) => item.type === 'URL',
  );
  const hasDomain = context.items.some(
    (item) => item.type === 'Domain',
  );
  const hasEndpoint = hasHashIndicator(context);

  if (
    (hasUrl || hasDomain) &&
    hasEndpoint
  ) {
    return (
      'La présence simultanée d’indicateurs réseau et d’empreintes de fichiers ' +
      'permet de croiser les observations dans le SIEM, les équipements réseau ' +
      'et l’EDR. Le lot est exploitable pour rechercher une communication, un ' +
      'téléchargement ou une exécution associée.'
    );
  }

  if (hasUrl || hasDomain) {
    return (
      'Le lot est principalement orienté réseau. Les domaines et URL peuvent ' +
      'être recherchés dans les journaux DNS, proxy, firewall, NDR et Secure Web ' +
      'Gateway afin d’identifier les systèmes et utilisateurs concernés.'
    );
  }

  if (hasEndpoint) {
    return (
      'Le lot est principalement orienté endpoint. Les empreintes peuvent être ' +
      'recherchées dans l’EDR, les inventaires de fichiers et les événements de ' +
      'création ou d’exécution afin de qualifier leur présence.'
    );
  }

  return (
    'Les indicateurs fournissent un point de départ technique. Leur valeur dépend ' +
    'de la télémétrie disponible, du contexte d’apparition et de la criticité des ' +
    'systèmes concernés.'
  );
}

function getInvestigationSteps(
  context: PdfContext,
): InvestigationStep[] {
  const steps: InvestigationStep[] = [];

  if (hasNetworkIndicator(context)) {
    steps.push({
      domain: 'NETWORK',
      title: 'Rechercher dans la télémétrie réseau',
      why:
        'Identifier des communications, résolutions DNS ou accès web associés aux IOC.',
      sources: ['DNS', 'Proxy', 'Firewall', 'NDR'],
      expected:
        'Machines, utilisateurs, horodatages et flux concernés.',
    });
  }

  if (hasHashIndicator(context)) {
    steps.push({
      domain: 'ENDPOINT',
      title: 'Vérifier dans l’EDR',
      why:
        'Déterminer si les empreintes ou ressources associées ont été créées, manipulées ou exécutées.',
      sources: ['Process', 'File', 'Registry', 'Network'],
      expected:
        'Processus, fichiers, artefacts et endpoints associés.',
    });
  }

  if (
    context.items.some(
      (item) =>
        item.type === 'Domain' ||
        item.type === 'URL' ||
        item.type === 'IPv4' ||
        item.type === 'IPv6',
    )
  ) {
    steps.push({
      domain: 'THREAT INTEL',
      title: 'Enrichir les IOC publics',
      why:
        'Évaluer la réputation, l’historique, l’infrastructure et les relations techniques connues.',
      sources: ['WHOIS', 'DNS', 'Reputation', 'History'],
      expected:
        'Contexte de menace, score de réputation et relations associées.',
    });
  }

  steps.push({
    domain: 'VALIDATION',
    title: 'Préserver et qualifier le contexte',
    why:
      'Conserver la source initiale et confirmer chaque observation avec la télémétrie disponible.',
    sources: ['Ticket', 'Source', 'Timeline', 'Evidence'],
    expected:
      'Conclusion reproductible, périmètre qualifié et éléments de preuve conservés.',
  });

  return steps;
}

function getDomainColors(
  domain: InvestigationDomain,
): {
  foreground: PdfColor;
  background: PdfColor;
} {
  switch (domain) {
    case 'ENDPOINT':
      return {
        foreground: COLORS.purple,
        background: COLORS.purpleSoft,
      };

    case 'THREAT INTEL':
      return {
        foreground: COLORS.green,
        background: COLORS.greenSoft,
      };

    case 'VALIDATION':
      return {
        foreground: COLORS.amber,
        background: COLORS.amberSoft,
      };

    case 'NETWORK':
    default:
      return {
        foreground: COLORS.blue,
        background: COLORS.blueSoft,
      };
  }
}

function drawV2PageHeader(
  context: PdfContext,
  phase: string,
  title: string,
  subtitle: string,
): void {
  const { doc } = context;

  setFillColor(doc, COLORS.navy);
  doc.rect(
    0,
    0,
    PAGE.width,
    34,
    'F',
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setTextColor(doc, [163, 187, 220]);
  doc.text(
    'MM SECURITY INTELLIGENCE SUITE',
    PAGE.marginLeft,
    10,
  );

  doc.setFontSize(7);
  setTextColor(doc, [190, 204, 224]);
  doc.text(
    phase.toUpperCase(),
    PAGE.width - PAGE.marginRight,
    10,
    { align: 'right' },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  setTextColor(doc, COLORS.white);
  doc.text(
    title,
    PAGE.marginLeft,
    20,
  );

  drawWrappedText(
    context,
    subtitle,
    PAGE.marginLeft,
    26,
    CONTENT_WIDTH,
    {
      fontSize: 8.5,
      color: [190, 204, 224],
      lineHeight: 3.6,
    },
  );

  context.cursorY = 43;
}

function startV2Page(
  context: PdfContext,
  phase: string,
  title: string,
  subtitle: string,
): void {
  if (context.pageNumber > 0) {
    context.doc.addPage();
    context.pageNumber += 1;
  }

  drawFooter(
    context,
    context.pageNumber,
  );

  drawV2PageHeader(
    context,
    phase,
    title,
    subtitle,
  );
}

function drawV2Kicker(
  context: PdfContext,
  value: string,
  x: number,
  y: number,
  color: PdfColor = COLORS.blue,
): void {
  const { doc } = context;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setTextColor(doc, color);
  doc.text(
    value.toUpperCase(),
    x,
    y,
  );
}

function drawV2Metric(
  context: PdfContext,
  x: number,
  y: number,
  width: number,
  value: string | number,
  label: string,
  detail: string,
): void {
  const { doc } = context;

  setFillColor(doc, COLORS.white);
  setDrawColor(doc, COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(
    x,
    y,
    width,
    31,
    2.5,
    2.5,
    'FD',
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setTextColor(doc, COLORS.navy);
  doc.text(
    String(value),
    x + 5,
    y + 10,
  );

  doc.setFontSize(8.5);
  doc.text(
    label,
    x + 5,
    y + 17,
  );

  drawWrappedText(
    context,
    detail,
    x + 5,
    y + 23,
    width - 10,
    {
      fontSize: 7.2,
      color: COLORS.textSoft,
      lineHeight: 3,
    },
  );
}

function drawV2BulletList(
  context: PdfContext,
  lines: string[],
  x: number,
  y: number,
  width: number,
): number {
  let cursorY = y;

  for (const line of lines) {
    setFillColor(context.doc, COLORS.green);
    context.doc.circle(
      x + 1.8,
      cursorY - 1.2,
      1.2,
      'F',
    );

    const height = drawWrappedText(
      context,
      line,
      x + 6,
      cursorY,
      width - 6,
      {
        fontSize: 8.5,
        color: COLORS.text,
        lineHeight: 3.8,
      },
    );

    cursorY += height + 3;
  }

  return cursorY - y;
}

function drawV2ExecutiveAssessment(
  context: PdfContext,
): void {
  drawReportHeader(context);

  /*
   * Le header historique fournit l'identité principale du document.
   * On remplace simplement son point de départ par une lecture narrative.
   */
  context.cursorY = 66;

  drawV2Kicker(
    context,
    '01 - Executive assessment',
    PAGE.marginLeft,
    context.cursorY,
  );

  context.doc.setFont('helvetica', 'bold');
  context.doc.setFontSize(16);
  setTextColor(context.doc, COLORS.navy);
  context.doc.text(
    'Que dois-je retenir ?',
    PAGE.marginLeft,
    context.cursorY + 8,
  );

  context.cursorY += 15;

  const gap = 4;
  const metricWidth =
    (CONTENT_WIDTH - gap * 3) / 4;

  const detectedTypes =
    getDetectedTypes(context);

  drawV2Metric(
    context,
    PAGE.marginLeft,
    context.cursorY,
    metricWidth,
    context.items.length,
    'IOC uniques',
    'Normalisés avant investigation.',
  );

  drawV2Metric(
    context,
    PAGE.marginLeft + metricWidth + gap,
    context.cursorY,
    metricWidth,
    detectedTypes.length,
    'Catégories',
    detectedTypes.join(', ') || 'Aucune catégorie.',
  );

  drawV2Metric(
    context,
    PAGE.marginLeft + (metricWidth + gap) * 2,
    context.cursorY,
    metricWidth,
    context.result.metrics.privateIps,
    'IP privées',
    context.result.metrics.privateIps > 0
      ? 'À rapprocher de l’inventaire.'
      : 'Aucune IP interne détectée.',
  );

  drawV2Metric(
    context,
    PAGE.marginLeft + (metricWidth + gap) * 3,
    context.cursorY,
    metricWidth,
    context.result.metrics.duplicatesRemoved,
    'Doublons',
    'Supprimés avant qualification.',
  );

  context.cursorY += 38;

  const columnGap = 4;
  const columnWidth =
    (CONTENT_WIDTH - columnGap * 2) / 3;
  const analysisY = context.cursorY;
  const analysisHeight = 70;

  setFillColor(context.doc, COLORS.white);
  setDrawColor(context.doc, COLORS.border);

  for (let index = 0; index < 3; index += 1) {
    context.doc.roundedRect(
      PAGE.marginLeft +
        index * (columnWidth + columnGap),
      analysisY,
      columnWidth,
      analysisHeight,
      2.5,
      2.5,
      'FD',
    );
  }

  const firstX = PAGE.marginLeft + 5;
  const secondX =
    PAGE.marginLeft +
    columnWidth +
    columnGap +
    5;
  const thirdX =
    PAGE.marginLeft +
    (columnWidth + columnGap) * 2 +
    5;

  drawV2Kicker(
    context,
    'Observations',
    firstX,
    analysisY + 8,
  );

  drawV2BulletList(
    context,
    getObservationLines(context),
    firstX,
    analysisY + 16,
    columnWidth - 10,
  );

  drawV2Kicker(
    context,
    'Interprétation',
    secondX,
    analysisY + 8,
  );

  drawWrappedText(
    context,
    getInterpretationText(context),
    secondX,
    analysisY + 16,
    columnWidth - 10,
    {
      fontSize: 8.5,
      color: COLORS.text,
      lineHeight: 3.8,
    },
  );

  drawV2Kicker(
    context,
    'Conclusion',
    thirdX,
    analysisY + 8,
  );

  const priorityColors =
    getPriorityColors(
      context.result.assessment.priority,
    );

  drawBadge(
    context.doc,
    context.result.assessment.title,
    thirdX,
    analysisY + 13,
    {
      background: priorityColors.background,
      foreground: priorityColors.foreground,
      fontSize: 6.4,
      height: 6.2,
    },
  );

  drawWrappedText(
    context,
    context.result.assessment.rationale,
    thirdX,
    analysisY + 27,
    columnWidth - 10,
    {
      fontSize: 8.5,
      color: COLORS.text,
      lineHeight: 3.8,
    },
  );

  drawWrappedText(
    context,
    'Cette analyse aide à qualifier les IOC. Elle ne constitue pas un verdict de malveillance.',
    thirdX,
    analysisY + 54,
    columnWidth - 10,
    {
      fontSize: 7.7,
      color: COLORS.textSoft,
      lineHeight: 3.4,
    },
  );

  context.cursorY += analysisHeight + 7;

  const quickHeight = 32;
  setFillColor(context.doc, COLORS.navy);
  context.doc.roundedRect(
    PAGE.marginLeft,
    context.cursorY,
    CONTENT_WIDTH,
    quickHeight,
    3,
    3,
    'F',
  );

  drawV2Kicker(
    context,
    'Jugement rapide',
    PAGE.marginLeft + 6,
    context.cursorY + 8,
    [147, 197, 253],
  );

  context.doc.setFont('helvetica', 'bold');
  context.doc.setFontSize(14);
  setTextColor(context.doc, COLORS.white);
  context.doc.text(
    context.result.assessment.title,
    PAGE.marginLeft + 6,
    context.cursorY + 17,
  );

  drawWrappedText(
    context,
    context.result.assessment.decision,
    PAGE.marginLeft + 6,
    context.cursorY + 24,
    CONTENT_WIDTH - 58,
    {
      fontSize: 8,
      color: [190, 204, 224],
      lineHeight: 3.4,
    },
  );

  drawBadge(
    context.doc,
    context.result.assessment.priorityLabel,
    PAGE.width - PAGE.marginRight - 38,
    context.cursorY + 10,
    {
      background: priorityColors.foreground,
      foreground: COLORS.white,
      fontSize: 7.5,
      height: 8,
      paddingX: 4,
    },
  );

  context.cursorY += quickHeight + 5;
}

function drawV2InvestigationStep(
  context: PdfContext,
  step: InvestigationStep,
  sequence: number,
): void {
  const { doc } = context;
  const height = 52;

  ensureSpace(context, height + 5);

  const startY = context.cursorY;
  const domainColors = getDomainColors(step.domain);

  setFillColor(doc, COLORS.white);
  setDrawColor(doc, COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(
    PAGE.marginLeft,
    startY,
    CONTENT_WIDTH,
    height,
    2.8,
    2.8,
    'FD',
  );

  // Bandeau supérieur : numéro, domaine et action.
  setFillColor(doc, domainColors.background);
  doc.roundedRect(
    PAGE.marginLeft,
    startY,
    CONTENT_WIDTH,
    14,
    2.8,
    2.8,
    'F',
  );
  // Masque les arrondis inférieurs du bandeau pour obtenir une séparation nette.
  doc.rect(
    PAGE.marginLeft,
    startY + 9,
    CONTENT_WIDTH,
    5,
    'F',
  );

  setFillColor(doc, domainColors.foreground);
  doc.roundedRect(
    PAGE.marginLeft + 4,
    startY + 3.3,
    12,
    7.4,
    1.8,
    1.8,
    'F',
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  setTextColor(doc, COLORS.white);
  doc.text(
    String(sequence).padStart(2, '0'),
    PAGE.marginLeft + 10,
    startY + 8.2,
    { align: 'center' },
  );

  drawV2Kicker(
    context,
    step.domain,
    PAGE.marginLeft + 20,
    startY + 8.2,
    domainColors.foreground,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.2);
  setTextColor(doc, COLORS.navy);
  doc.text(
    step.title,
    PAGE.marginLeft + 50,
    startY + 8.5,
  );

  // Deux colonnes réellement larges.
  const innerX = PAGE.marginLeft + 6;
  const innerWidth = CONTENT_WIDTH - 12;
  const gap = 8;
  const columnWidth = (innerWidth - gap) / 2;
  const contentY = startY + 21;

  drawV2Kicker(
    context,
    'Pourquoi ?',
    innerX,
    contentY,
  );
  drawWrappedText(
    context,
    step.why,
    innerX,
    contentY + 6,
    columnWidth,
    {
      fontSize: 8.1,
      color: COLORS.text,
      lineHeight: 3.6,
    },
  );

  const expectedX = innerX + columnWidth + gap;
  drawV2Kicker(
    context,
    'Résultat attendu',
    expectedX,
    contentY,
    domainColors.foreground,
  );
  drawWrappedText(
    context,
    step.expected,
    expectedX,
    contentY + 6,
    columnWidth,
    {
      fontSize: 8.1,
      color: COLORS.text,
      lineHeight: 3.6,
    },
  );

  // Sources sur une ligne dédiée : plus de troisième colonne étroite.
  const sourcesY = startY + height - 8;
  setDrawColor(doc, COLORS.border);
  doc.line(
    innerX,
    sourcesY - 4,
    PAGE.width - PAGE.marginRight - 6,
    sourcesY - 4,
  );

  drawV2Kicker(
    context,
    'Sources',
    innerX,
    sourcesY,
    COLORS.textMuted,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  setTextColor(doc, COLORS.textSoft);
  doc.text(
    step.sources.join('  |  '),
    innerX + 20,
    sourcesY,
  );

  context.cursorY += height + 5;
}

function drawV2InvestigationPage(
  context: PdfContext,
): void {
  startV2Page(
    context,
    '02 - Investigation',
    'Par quoi commencer ?',
    'Plan d’investigation ordonné. Chaque étape précise l’objectif, les sources à consulter et le résultat attendu.',
  );

  const steps =
    getInvestigationSteps(context);

  steps.forEach(
    (step, index) => {
      drawV2InvestigationStep(
        context,
        step,
        index + 1,
      );
    },
  );

  context.cursorY += 2;

  setFillColor(context.doc, COLORS.greenSoft);
  setDrawColor(context.doc, [187, 230, 201]);
  context.doc.roundedRect(
    PAGE.marginLeft,
    context.cursorY,
    CONTENT_WIDTH,
    18,
    2.5,
    2.5,
    'FD',
  );

  drawV2Kicker(
    context,
    'Engineering guidance',
    PAGE.marginLeft + 6,
    context.cursorY + 7,
    COLORS.green,
  );

  drawWrappedText(
    context,
    'Les actions proposées doivent être adaptées à la télémétrie, aux procédures internes et à la criticité des systèmes concernés.',
    PAGE.marginLeft + 6,
    context.cursorY + 13,
    CONTENT_WIDTH - 12,
    {
      fontSize: 7.8,
      color: COLORS.textSoft,
      lineHeight: 3.3,
    },
  );
}

function drawV2EvidenceHeader(
  context: PdfContext,
): void {
  startV2Page(
    context,
    '03 - Evidence',
    'Sur quoi repose cette analyse ?',
    `${context.items.length} IOC collecté${context.items.length > 1 ? 's' : ''}, normalisé${context.items.length > 1 ? 's' : ''} et exporté${context.items.length > 1 ? 's' : ''} en mode ${context.options.valueMode}.`,
  );
}

function drawV2EvidenceTableHeader(
  context: PdfContext,
): void {
  const { doc } = context;
  const y = context.cursorY;
  const widths = [24, 85, 29, 32];
  const labels = ['Type', 'Indicateur', 'Statut', 'Origine'];
  let x = PAGE.marginLeft;

  setFillColor(doc, COLORS.navy);
  doc.roundedRect(
    PAGE.marginLeft,
    y,
    CONTENT_WIDTH,
    10,
    2.2,
    2.2,
    'F',
  );

  labels.forEach((label, index) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    setTextColor(doc, COLORS.white);
    doc.text(label.toUpperCase(), x + 4, y + 6.3);
    x += widths[index];
  });

  context.cursorY += 10;
}

function startV2EvidenceContinuationPage(
  context: PdfContext,
): void {
  addPage(context);
  drawV2PageHeader(
    context,
    '03 - Evidence',
    'Sur quoi repose cette analyse ?',
    'Suite des observables normalisés inclus dans le rapport.',
  );
  drawV2EvidenceTableHeader(context);
}

function calculateV2EvidenceRowHeight(
  context: PdfContext,
  item: IocItem,
): number {
  const { doc, options } = context;
  const indicator = sanitizePdfText(
    getIocExportValue(item, options.valueMode),
  );

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  const indicatorLines = doc.splitTextToSize(
    indicator,
    77,
  ) as string[];

  let height = Math.max(12, 7 + indicatorLines.length * 3.2);

  if (options.includeContext && item.context) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    const contextLines = doc.splitTextToSize(
      flattenPdfText(item.context),
      CONTENT_WIDTH - 12,
    ) as string[];
    height += 5 + contextLines.length * 3.1;
  }

  return height;
}

function drawV2EvidenceRow(
  context: PdfContext,
  item: IocItem,
  sequence: number,
): void {
  const { doc, options } = context;
  const rowHeight = calculateV2EvidenceRowHeight(context, item);
  const maximumY = PAGE.height - PAGE.marginBottom - 9;

  if (context.cursorY + rowHeight > maximumY) {
    startV2EvidenceContinuationPage(context);
  }

  const y = context.cursorY;
  const widths = [24, 85, 29, 32];
  const xPositions = [
    PAGE.marginLeft,
    PAGE.marginLeft + widths[0],
    PAGE.marginLeft + widths[0] + widths[1],
    PAGE.marginLeft + widths[0] + widths[1] + widths[2],
  ];

  setFillColor(doc, sequence % 2 === 0 ? COLORS.surface : COLORS.white);
  setDrawColor(doc, COLORS.border);
  doc.rect(PAGE.marginLeft, y, CONTENT_WIDTH, rowHeight, 'FD');

  for (let index = 1; index < xPositions.length; index += 1) {
    doc.line(xPositions[index], y, xPositions[index], y + rowHeight);
  }

  const statusColors = getStatusColors(item.status);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.3);
  setTextColor(doc, COLORS.navy);
  doc.text(item.type, xPositions[0] + 4, y + 7);

  const indicator = sanitizePdfText(
    getIocExportValue(item, options.valueMode),
  );
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  setTextColor(doc, COLORS.text);
  const indicatorLines = doc.splitTextToSize(indicator, widths[1] - 8) as string[];
  doc.text(indicatorLines, xPositions[1] + 4, y + 6.5, {
    lineHeightFactor: 1.08,
  });

  drawBadge(
    doc,
    getStatusLabel(item.status),
    xPositions[2] + 4,
    y + 3.2,
    {
      background: statusColors.background,
      foreground: statusColors.foreground,
      fontSize: 6.1,
      height: 6,
      paddingX: 2,
    },
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  setTextColor(doc, COLORS.textSoft);
  doc.text(getOriginLabel(item), xPositions[3] + 4, y + 7);

  if (options.includeContext && item.context) {
    const baseHeight = Math.max(12, 7 + indicatorLines.length * 3.2);
    const contextY = y + baseHeight;
    setDrawColor(doc, COLORS.border);
    doc.line(
      PAGE.marginLeft + 4,
      contextY - 2,
      PAGE.width - PAGE.marginRight - 4,
      contextY - 2,
    );
    drawV2Kicker(
      context,
      'Contexte',
      PAGE.marginLeft + 4,
      contextY + 2,
      COLORS.textMuted,
    );
    drawWrappedText(
      context,
      flattenPdfText(item.context),
      PAGE.marginLeft + 28,
      contextY + 2,
      CONTENT_WIDTH - 32,
      {
        fontSize: 7.2,
        color: COLORS.textSoft,
        lineHeight: 3.1,
      },
    );
  }

  context.cursorY += rowHeight;
}

function drawV2EvidenceTable(
  context: PdfContext,
): void {
  drawV2EvidenceTableHeader(context);

  if (context.items.length === 0) {
    setFillColor(context.doc, COLORS.surface);
    setDrawColor(context.doc, COLORS.border);
    context.doc.rect(
      PAGE.marginLeft,
      context.cursorY,
      CONTENT_WIDTH,
      18,
      'FD',
    );
    drawWrappedText(
      context,
      'Aucun indicateur correspondant aux options d’export sélectionnées.',
      PAGE.marginLeft + 5,
      context.cursorY + 8,
      CONTENT_WIDTH - 10,
      { fontSize: 8.2, color: COLORS.textSoft },
    );
    context.cursorY += 18;
    return;
  }

  context.items.forEach((item, index) => {
    drawV2EvidenceRow(context, item, index + 1);
  });
}

function drawV2Traceability(
  context: PdfContext,
): void {
  startV2Page(
    context,
    '04 - Report',
    'Comment partager ou archiver ?',
    'Informations nécessaires à la traçabilité, au partage et à la reproductibilité de l’analyse.',
  );

  const { doc, result, options } =
    context;

  const tableY = context.cursorY;
  const rowHeight = 13;
  const rows = [
    ['Identifiant du rapport', result.metadata.reportId],
    ['Généré le', formatPdfDate(result.metadata.generatedAt)],
    ['Moteur', `MM IOC Analyzer ${result.metadata.toolVersion}`],
    [
      'Mode d’analyse',
      result.metadata.processingMode === 'local'
        ? 'Local - aucune transmission'
        : result.metadata.processingMode,
    ],
    [
      'Analyste',
      options.analystName || 'Non renseigné',
    ],
    [
      'Référence',
      options.caseReference || 'Non renseignée',
    ],
    [
      'Classification',
      getClassification(context),
    ],
  ];

  setFillColor(doc, COLORS.white);
  setDrawColor(doc, COLORS.border);
  doc.roundedRect(
    PAGE.marginLeft,
    tableY,
    CONTENT_WIDTH,
    rows.length * rowHeight,
    2.5,
    2.5,
    'FD',
  );

  rows.forEach(
    ([label, value], index) => {
      const y =
        tableY +
        index * rowHeight;

      if (index > 0) {
        setDrawColor(doc, COLORS.border);
        doc.line(
          PAGE.marginLeft,
          y,
          PAGE.width - PAGE.marginRight,
          y,
        );
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      setTextColor(doc, COLORS.textMuted);
      doc.text(
        label.toUpperCase(),
        PAGE.marginLeft + 6,
        y + 8,
      );

      drawWrappedText(
        context,
        value,
        PAGE.marginLeft + 59,
        y + 8,
        CONTENT_WIDTH - 65,
        {
          fontSize: 8.5,
          color: COLORS.text,
          lineHeight: 3.6,
        },
      );
    },
  );

  context.cursorY +=
    rows.length * rowHeight + 9;

  setFillColor(doc, COLORS.navy);
  doc.roundedRect(
    PAGE.marginLeft,
    context.cursorY,
    CONTENT_WIDTH,
    47,
    3,
    3,
    'F',
  );

  drawV2Kicker(
    context,
    'SHA-256 du rapport',
    PAGE.marginLeft + 7,
    context.cursorY + 9,
    [147, 197, 253],
  );

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.4);
  setTextColor(doc, COLORS.white);

  const hashLines =
    doc.splitTextToSize(
      result.metadata.reportHash,
      CONTENT_WIDTH - 14,
    ) as string[];

  doc.text(
    hashLines,
    PAGE.marginLeft + 7,
    context.cursorY + 18,
    {
      lineHeightFactor: 1.2,
    },
  );

  drawWrappedText(
    context,
    'Cette empreinte identifie le contenu logique du rapport au moment de sa génération.',
    PAGE.marginLeft + 7,
    context.cursorY + 36,
    CONTENT_WIDTH - 14,
    {
      fontSize: 7.7,
      color: [190, 204, 224],
      lineHeight: 3.3,
    },
  );

  context.cursorY += 56;

  setFillColor(doc, COLORS.greenSoft);
  setDrawColor(doc, [187, 230, 201]);
  doc.roundedRect(
    PAGE.marginLeft,
    context.cursorY,
    CONTENT_WIDTH,
    20,
    2.5,
    2.5,
    'FD',
  );

  drawV2Kicker(
    context,
    'Analyse locale',
    PAGE.marginLeft + 6,
    context.cursorY + 8,
    COLORS.green,
  );

  drawWrappedText(
    context,
    'Le rapport est généré dans le navigateur. Aucun IOC n’est transmis par le moteur PDF.',
    PAGE.marginLeft + 6,
    context.cursorY + 14,
    CONTENT_WIDTH - 12,
    {
      fontSize: 8,
      color: COLORS.text,
      lineHeight: 3.4,
    },
  );
}


/**
 * Construit le document PDF sans le télécharger.
 */
export function createIocPdfDocument(
  result: IocAnalysisResult,
  options?: IocPdfOptions,
): jsPDF {
  const resolvedOptions =
    resolvePdfOptions(options);

  const items =
    filterIocItemsForExport(
      result.items,
      {
        valueMode:
          resolvedOptions.valueMode,
        includeContext:
          resolvedOptions.includeContext,
        includeMetadata:
          resolvedOptions.includeMetadata,
        includeRecommendations:
          resolvedOptions.includeRecommendations,
        includeExtractedIndicators:
          resolvedOptions.includeExtractedIndicators,
        includedTypes:
          resolvedOptions.includedTypes,
      },
    );

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
    putOnlyUsedFonts: true,
  });

  doc.setProperties({
    title: `MM IOC Analysis Report - ${result.metadata.reportId}`,
    subject:
      'IOC extraction and analysis report',
    author:
      resolvedOptions.analystName ||
      'MM IOC Analyzer',
    creator: `MM IOC Analyzer ${result.metadata.toolVersion}`,
    keywords:
      'IOC, SOC, cybersecurity, threat intelligence, incident response',
  });

  const context: PdfContext = {
    doc,
    result,
    items,
    options: resolvedOptions,
    cursorY: PAGE.marginTop,
    pageNumber: 1,
  };

  /*
   * IOC PDF V2
   *
   * Le rapport est volontairement découpé en phases stables. Les IOC peuvent
   * occuper plusieurs pages, mais l'ordre narratif reste identique.
   */
  drawV2ExecutiveAssessment(context);
  drawV2InvestigationPage(context);
  drawV2EvidenceHeader(context);
  drawV2EvidenceTable(context);
  drawV2Traceability(context);
  drawSourceAppendix(context);
  finalizePageNumbers(context);

  return doc;
}

/**
 * Génère le PDF, son Blob et son nom de fichier.
 *
 * Le téléchargement est facultatif.
 */
export function generateIocPdf(
  result: IocAnalysisResult,
  options?: IocPdfOptions,
): GeneratedIocPdf {
  const resolvedOptions =
    resolvePdfOptions(options);

  const document =
    createIocPdfDocument(
      result,
      resolvedOptions,
    );

  const filename =
    resolvedOptions.filename
      ? sanitizeFilename(
          resolvedOptions.filename,
        ).replace(/\.pdf$/i, '') +
        '.pdf'
      : createPdfFilename(result);

  const blob =
    document.output('blob');

  if (resolvedOptions.download) {
    document.save(filename);
  }

  return {
    document,
    filename,
    blob,
  };
}

/**
 * Télécharge directement le rapport PDF.
 *
 * À appeler uniquement après une action explicite
 * de l'utilisateur dans le navigateur.
 */
export function downloadIocPdf(
  result: IocAnalysisResult,
  options?: Omit<
    IocPdfOptions,
    'download'
  >,
): void {
  generateIocPdf(
    result,
    {
      ...options,
      download: true,
    },
  );
}

/**
 * Ouvre le rapport dans un nouvel onglet.
 *
 * Cette fonction doit également être déclenchée
 * depuis une action utilisateur pour éviter
 * le blocage des pop-ups.
 */
export function openIocPdfPreview(
  result: IocAnalysisResult,
  options?: IocPdfOptions,
): void {
  if (
    typeof window === 'undefined' ||
    typeof URL === 'undefined'
  ) {
    throw new Error(
      'La prévisualisation PDF est uniquement disponible dans un navigateur.',
    );
  }

  const generated =
    generateIocPdf(
      result,
      {
        ...options,
        download: false,
      },
    );

  const objectUrl =
    URL.createObjectURL(
      generated.blob,
    );

  const previewWindow =
    window.open(
      objectUrl,
      '_blank',
      'noopener,noreferrer',
    );

  if (!previewWindow) {
    URL.revokeObjectURL(
      objectUrl,
    );

    throw new Error(
      'La fenêtre de prévisualisation a été bloquée par le navigateur.',
    );
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(
      objectUrl,
    );
  }, 60_000);
}