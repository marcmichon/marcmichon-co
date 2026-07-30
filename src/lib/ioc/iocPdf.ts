import { jsPDF } from 'jspdf';

export interface IocPdfItem {
  type: string;
  value: string;
  context: string;
  status: string;
}

export interface IocPdfReport {
  generatedAt: string;
  reportHash: string;
  title: string;
  priority: string;
  summary: string[];
  decision: string;
  rationale: string;
  metrics: {
    detected: number;
    unique: number;
    types: number;
    privateIps: number;
    duplicates: number;
  };
  recommendations: Array<{ priority: string; title: string; description: string }>;
  items: IocPdfItem[];
}

const C = {
  navy: [3, 7, 18] as const,
  card: [15, 23, 42] as const,
  blue: [37, 99, 235] as const,
  lightBlue: [96, 165, 250] as const,
  white: [248, 250, 252] as const,
  text: [15, 23, 42] as const,
  muted: [100, 116, 139] as const,
  border: [226, 232, 240] as const,
  surface: [248, 250, 252] as const,
  green: [22, 163, 74] as const,
  amber: [217, 119, 6] as const,
  red: [220, 38, 38] as const,
};

type Color = readonly [number, number, number];

export function exportIocPdf(report: IocPdfReport): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const width = pageW - margin * 2;
  const footerY = pageH - 13;
  let y = 18;
  let page = 1;

  const fill = (c: Color) => doc.setFillColor(...c);
  const draw = (c: Color) => doc.setDrawColor(...c);
  const text = (c: Color) => doc.setTextColor(...c);

  const footer = () => {
    draw(C.border);
    doc.setLineWidth(.2);
    doc.line(margin, footerY - 3, pageW - margin, footerY - 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    text(C.muted);
    doc.text('MM Security Intelligence · marcmichon.co', margin, footerY + 2);
    doc.text(`Page ${page}`, pageW - margin, footerY + 2, { align: 'right' });
  };

  const addPage = () => {
    footer();
    doc.addPage();
    page += 1;
    y = 17;
  };

  const ensure = (height: number) => {
    if (y + height > footerY - 6) addPage();
  };

  const wrapped = (value: string, options: { x?: number; maxWidth?: number; size?: number; lineHeight?: number; color?: Color; style?: 'normal' | 'bold' } = {}) => {
    const x = options.x ?? margin;
    const maxWidth = options.maxWidth ?? width;
    const size = options.size ?? 9.5;
    const lineHeight = options.lineHeight ?? 4.8;
    const lines = doc.splitTextToSize(value, maxWidth) as string[];
    ensure(lines.length * lineHeight + 2);
    doc.setFont('helvetica', options.style ?? 'normal');
    doc.setFontSize(size);
    text(options.color ?? C.text);
    doc.text(lines, x, y);
    y += lines.length * lineHeight;
  };

  const section = (number: string, title: string) => {
    ensure(18);
    y += 4;
    fill(C.blue);
    doc.roundedRect(margin, y - 4, 3, 10, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    text(C.blue);
    doc.text(number, margin + 7, y - 1);
    doc.setFontSize(14);
    text(C.text);
    doc.text(title, margin + 7, y + 4.5);
    y += 13;
  };

  // Cover
  fill(C.navy);
  doc.rect(0, 0, pageW, 88, 'F');
  fill(C.blue);
  doc.roundedRect(margin, 14, 49, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  text(C.white);
  doc.text('MM SECURITY INTELLIGENCE', margin + 24.5, 19.4, { align: 'center' });
  doc.setFontSize(26);
  doc.text('IOC Investigation Report', margin, 39);
  doc.setFontSize(11);
  text([191, 219, 254]);
  doc.text('Operational Decision Support', margin, 51);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  text([148, 163, 184]);
  doc.text(`Generated ${report.generatedAt}`, margin, 66);
  doc.text(`Report hash: ${report.reportHash}`, margin, 73);

  fill(C.red);
  doc.roundedRect(pageW - margin - 50, 18, 50, 30, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  text(C.white);
  doc.text('ASSESSMENT', pageW - margin - 25, 26, { align: 'center' });
  doc.setFontSize(11);
  const titleLines = doc.splitTextToSize(report.title.toUpperCase(), 42) as string[];
  doc.text(titleLines, pageW - margin - 25, 35, { align: 'center' });

  y = 99;
  fill(C.surface);
  draw(C.border);
  doc.roundedRect(margin, y, width, 30, 4, 4, 'FD');
  const metrics = [
    ['IOC uniques', report.metrics.unique],
    ['Types', report.metrics.types],
    ['IP privées', report.metrics.privateIps],
    ['Doublons', report.metrics.duplicates],
  ] as const;
  const metricW = width / 4;
  metrics.forEach(([label, value], index) => {
    const x = margin + index * metricW;
    if (index) {
      draw(C.border);
      doc.line(x, y + 6, x, y + 24);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    text(C.muted);
    doc.text(label.toUpperCase(), x + 5, y + 9);
    doc.setFontSize(18);
    text(C.text);
    doc.text(String(value), x + 5, y + 23);
  });
  y += 39;

  section('01', 'Executive Summary');
  wrapped(`${report.title} — ${report.priority}`, { size: 11, style: 'bold', lineHeight: 5.5 });
  y += 2;
  report.summary.forEach((p) => { wrapped(p, { color: C.muted, lineHeight: 5.1 }); y += 1.5; });
  ensure(28);
  fill(C.navy);
  doc.roundedRect(margin, y, width, 23, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  text(C.lightBlue);
  doc.text('LECTURE RAPIDE', margin + 6, y + 7);
  doc.setFontSize(10);
  text(C.white);
  doc.text(report.decision, margin + 6, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  text([203, 213, 225]);
  const rationale = doc.splitTextToSize(report.rationale, width - 80) as string[];
  doc.text(rationale, margin + 70, y + 9);
  y += 31;

  section('02', 'Plan d’investigation');
  report.recommendations.forEach((item, index) => {
    const lines = doc.splitTextToSize(item.description, width - 31) as string[];
    const h = Math.max(18, 10 + lines.length * 4.2);
    ensure(h + 3);
    fill(C.white);
    draw(C.border);
    doc.roundedRect(margin, y, width, h, 3, 3, 'FD');
    fill(C.blue);
    doc.circle(margin + 8, y + 8.5, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    text(C.white);
    doc.text(String(index + 1).padStart(2, '0'), margin + 8, y + 10.5, { align: 'center' });
    doc.setFontSize(7);
    text(C.blue);
    doc.text(item.priority.toUpperCase(), margin + 16, y + 6.5);
    doc.setFontSize(10);
    text(C.text);
    doc.text(item.title, margin + 16, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    text(C.muted);
    doc.text(lines, margin + 16, y + 17);
    y += h + 3;
  });

  section('03', 'Indicateurs structurés');
  const col = { type: margin, value: margin + 28, context: margin + 114, status: margin + 161 };
  ensure(12);
  fill(C.navy);
  doc.rect(margin, y, width, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  text(C.white);
  doc.text('TYPE', col.type + 2, y + 6.5);
  doc.text('INDICATEUR', col.value, y + 6.5);
  doc.text('CONTEXTE', col.context, y + 6.5);
  doc.text('STATUT', col.status, y + 6.5);
  y += 10;

  for (const item of report.items) {
    const valueLines = doc.splitTextToSize(item.value, 80) as string[];
    const contextLines = doc.splitTextToSize(item.context, 42) as string[];
    const rowH = Math.max(11, Math.max(valueLines.length, contextLines.length) * 4.1 + 5);
    ensure(rowH + 1);
    fill(C.white);
    draw(C.border);
    doc.rect(margin, y, width, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    text(C.blue);
    doc.text(item.type, col.type + 2, y + 6.5);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.2);
    text(C.text);
    doc.text(valueLines, col.value, y + 6.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    text(C.muted);
    doc.text(contextLines, col.context, y + 6.2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    text(item.status === 'PRIVATE' ? C.amber : C.green);
    doc.text(item.status, col.status, y + 6.5);
    y += rowH;
  }

  ensure(32);
  y += 8;
  fill([236, 253, 245]);
  draw([167, 243, 208]);
  doc.roundedRect(margin, y, width, 18, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  text(C.green);
  doc.text('CONFIDENTIALITÉ', margin + 6, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  text(C.muted);
  doc.text('Rapport généré localement. Usage interne uniquement. Aucun IOC transmis à un serveur.', margin + 6, y + 13);

  footer();
  doc.save(`mm-ioc-investigation-${new Date().toISOString().slice(0, 10)}.pdf`);
}
