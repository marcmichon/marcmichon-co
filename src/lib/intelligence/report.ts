/**
 * Compact client-side renderer for IntelligenceReport.astro.
 *
 * The page already exposes the executive decision, technical signals and
 * response plan. This module therefore hydrates only the final executive
 * assessment and provides the normalized data used by the PDF export.
 */

import { getTranslations } from '../../locales';

const tr = getTranslations('fr');
const t = tr.vulnerabilityExplorer;

type UnknownRecord = Record<string, unknown>;

export type ReportUrgency = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

export interface ReportAction {
	title: string;
	description: string;
	priority: string;
}

export interface ReportReasoning {
	title: string;
	source: string;
	summary: string;
	scoreContribution: number;
}

export interface NormalizedIntelligenceReport {
	cveId: string;
	description: string;
	cvssScore: number | null;
	epssProbability: number | null;
	isKnownExploited: boolean | null;
	sourceCount: number;
	sources: string[];
	decisionTitle: string;
	decisionSummary: string;
	decisionScore: number;
	urgency: ReportUrgency;
	urgencyLabel: string;
	confidenceLevel: string;
	confidenceScore: number;
	confidenceSummary: string;
	businessImpactTitle: string;
	businessImpactLevel: string;
	businessImpactSummary: string;
	executiveMessage: string;
	consequences: string[];
	actions: ReportAction[];
	analystNotes: string;
	reasoning: ReportReasoning[];
	generatedAt: Date;
}

export function renderIntelligenceReport(
	report: HTMLElement,
	briefValue: unknown,
	vulnerabilityValue: unknown,
): void {
	const data = normalizeIntelligenceReport(briefValue, vulnerabilityValue);

	report.dataset.urgency = data.urgency;

	setText(report, '[data-report-cve]', data.cveId);
	setText(report, '[data-report-summary]', buildOperationalVerdict(data));
	setText(report, '[data-report-impact-title]', data.businessImpactTitle);
	setText(report, '[data-report-impact-level]', data.businessImpactLevel);
	setText(report, '[data-report-impact-summary]', data.businessImpactSummary);
	setText(report, '[data-report-impact-message]', data.executiveMessage);
	setText(report, '[data-report-confidence-level]', data.confidenceLevel);
	setText(report, '[data-report-confidence-score]', `${data.confidenceScore}%`);
	setText(report, '[data-report-confidence-summary]', data.confidenceSummary);
	setProgress(report, '[data-report-confidence-bar]', data.confidenceScore);
	setText(report, '[data-report-source-count]', String(data.sourceCount));
	setText(report, '[data-report-generated-date]', formatDate(data.generatedAt));
	renderSourceList(report, data);
	bindPdfExport(report, data);
}

export function normalizeIntelligenceReport(
	briefValue: unknown,
	vulnerabilityValue: unknown,
): NormalizedIntelligenceReport {
	const brief = asRecord(briefValue);
	const vulnerability = asRecord(vulnerabilityValue);
	const decision = asRecord(brief.decision);
	const confidence = asRecord(brief.confidence);
	const businessImpact = asRecord(brief.businessImpact);

	const cveId =
		readString(vulnerability.cveId) ||
		readString(vulnerability.id) ||
		'Vulnérabilité';

	const description =
		readString(vulnerability.description) ||
		`Évaluation d’intelligence explicable générée pour ${cveId}.`;

	const cvss = asRecord(vulnerability.cvss);
	const epss = asRecord(vulnerability.epss);
	const kev = asRecord(vulnerability.kev);

	const cvssScore = normalizeNumber(cvss.score, 0, 10);
	const epssProbability = normalizeProbability(epss.score);
	const isKnownExploited = normalizeNullableBoolean(kev.listed);
	const sources = buildSources(cvssScore, epssProbability, isKnownExploited);

	const decisionTitle = readString(decision.title) || t.hero.assessmentPending;
	const decisionSummary =
		readString(decision.summary) ||
		'Aucune décision opérationnelle n’est actuellement disponible.';
	const decisionScore = normalizeInteger(decision.score, 0, 100, 0);
	const urgency = normalizeUrgency(readString(decision.urgency));
	const urgencyLabel = formatLabel(readString(decision.urgency) || urgency);

	const confidenceScore = normalizeInteger(confidence.score, 0, 100, 0);
	const confidenceLevel = formatLabel(
		readString(confidence.level) || confidenceFromScore(confidenceScore),
	);
	const confidenceSummary =
		readString(confidence.summary) ||
		buildConfidenceSummary(
			confidenceScore,
			cvssScore,
			epssProbability,
			isKnownExploited,
		);

	const businessImpactSummary =
		readString(businessImpact.summary) ||
		'L’impact opérationnel dépend du périmètre d’actifs affectés, de leur exposition et de leur criticité métier.';
	const executiveMessage =
		readString(businessImpact.executiveMessage) ||
		'Validez l’exposition et la criticité métier avant toute action de remédiation à fort impact.';
	const businessImpactTitle =
		readString(businessImpact.title) || defaultImpactTitle(urgency);
	const businessImpactLevel = formatLabel(
		readString(businessImpact.level) ||
		readString(decision.urgency) ||
		urgency,
	);

	const consequences = normalizeStringArray(businessImpact.consequences);
	const actions = normalizeActions(brief.actions, urgency);
	const analystNotes =
		readString(brief.analystNotes) ||
		'L’exposition des actifs, leur criticité métier et les mesures compensatoires doivent être validées avant la décision opérationnelle finale.';
	const reasoning = normalizeReasoning(
		brief.reasoning,
		cvssScore,
		epssProbability,
		isKnownExploited,
	);

	return {
		cveId,
		description,
		cvssScore,
		epssProbability,
		isKnownExploited,
		sourceCount: sources.length,
		sources,
		decisionTitle,
		decisionSummary,
		decisionScore,
		urgency,
		urgencyLabel,
		confidenceLevel,
		confidenceScore,
		confidenceSummary,
		businessImpactTitle,
		businessImpactLevel,
		businessImpactSummary,
		executiveMessage,
		consequences:
			consequences.length > 0
				? consequences
				: defaultConsequences(urgency, isKnownExploited),
		actions,
		analystNotes,
		reasoning,
		generatedAt: new Date(),
	};
}

function buildOperationalVerdict(data: NormalizedIntelligenceReport): string {
	return `${data.cveId} est évaluée avec une priorité ${data.urgencyLabel.toLowerCase()}. ${data.decisionSummary}`;
}

function buildSources(
	cvssScore: number | null,
	epssProbability: number | null,
	isKnownExploited: boolean | null,
): string[] {
	const sources: string[] = [];
	if (cvssScore !== null) sources.push('NVD');
	if (epssProbability !== null) sources.push('FIRST EPSS');
	if (isKnownExploited !== null) sources.push('CISA KEV');
	return sources;
}

function renderSourceList(
	report: HTMLElement,
	data: NormalizedIntelligenceReport,
): void {
	const list = report.querySelector<HTMLElement>('[data-report-sources]');
	if (!list) return;

	const status = new Map<string, string>([
		['NVD', data.cvssScore === null ? tr.common.unavailable : `CVSS ${data.cvssScore.toFixed(1)}`],
		[
			'FIRST EPSS',
			data.epssProbability === null
				? tr.common.unavailable
				: formatPercent(data.epssProbability, 2),
		],
		[
			'CISA KEV',
			data.isKnownExploited === null
				? tr.common.unavailable
				: data.isKnownExploited
					? tr.common.listed
					: tr.common.notListed,
		],
	]);

	for (const item of list.querySelectorAll<HTMLElement>('[data-report-source]')) {
		const source = item.dataset.reportSource || '';
		item.dataset.available = data.sources.includes(source) ? 'true' : 'false';
		setText(item, '[data-report-source-status]', status.get(source) || tr.common.unavailable);
	}
}

function bindPdfExport(
	report: HTMLElement,
	data: NormalizedIntelligenceReport,
): void {
	const button = report.querySelector<HTMLButtonElement>('[data-report-export-pdf]');
	if (!button) return;

	/*
	 * The assessment component is reused for every search. Replacing `onclick`
	 * on each render guarantees that the export always closes over the latest
	 * normalized report instead of retaining the first CVE in memory.
	 */
	button.onclick = async () => {
		const defaultLabel = t.assessment.export;
		button.disabled = true;
		button.dataset.state = 'loading';
		button.textContent = t.assessment.generating;

		try {
			const { exportVulnerabilityPdf } = await import('./vulnerabilityPdf');
			exportVulnerabilityPdf(data);
			button.dataset.state = 'success';
			button.textContent = t.assessment.exported;
		} catch (error) {
			console.error('Unable to export vulnerability PDF', error);
			button.dataset.state = 'error';
			button.textContent = t.assessment.exportFailed;
		} finally {
			window.setTimeout(() => {
				button.disabled = false;
				button.dataset.state = 'idle';
				button.textContent = defaultLabel;
			}, 1800);
		}
	};
}

function normalizeActions(value: unknown, urgency: ReportUrgency): ReportAction[] {
	const fallbackPriority =
		urgency === 'critical' ? 'Critical' : urgency === 'high' ? 'High' : 'Medium';
	const actions = Array.isArray(value) ? value : [];

	const normalized = actions
		.map((item): ReportAction | null => {
			if (typeof item === 'string' && item.trim()) {
				return {
					title: item.trim(),
					description:
						'Execute this action according to the affected scope and operational constraints.',
					priority: fallbackPriority,
				};
			}

			const action = asRecord(item);
			const title = readString(action.title);
			if (!title) return null;

			return {
				title,
				description:
					readString(action.description) ||
					'Execute this action according to the affected scope and operational constraints.',
				priority: formatLabel(readString(action.priority) || fallbackPriority),
			};
		})
		.filter((item): item is ReportAction => item !== null)
		.slice(0, 5);

	return normalized.length > 0 ? normalized : defaultActions(urgency);
}

function normalizeReasoning(
	value: unknown,
	cvssScore: number | null,
	epssProbability: number | null,
	isKnownExploited: boolean | null,
): ReportReasoning[] {
	const reasoning = Array.isArray(value) ? value : [];
	const normalized = reasoning
		.map((item): ReportReasoning | null => {
			const record = asRecord(item);
			const summary = readString(record.summary);
			if (!summary) return null;

			return {
				title: readString(record.title) || 'Decision signal',
				source: readString(record.source) || 'MM Decision Engine',
				summary,
				scoreContribution: normalizeInteger(
					record.scoreContribution,
					-100,
					100,
					0,
				),
			};
		})
		.filter((item): item is ReportReasoning => item !== null)
		.slice(0, 4);

	if (normalized.length > 0) return normalized;

	const fallback: ReportReasoning[] = [];
	if (cvssScore !== null) {
		fallback.push({
			title: `CVSS ${cvssScore.toFixed(1)}`,
			source: 'NVD',
			summary:
				'Technical severity contributes to the operational prioritization score.',
			scoreContribution: cvssScore >= 9 ? 30 : cvssScore >= 7 ? 20 : 10,
		});
	}
	if (epssProbability !== null) {
		fallback.push({
			title: `EPSS ${formatPercent(epssProbability, 2)}`,
			source: 'FIRST EPSS',
			summary:
				'La probabilité d’exploitation ajuste l’urgence selon le niveau de menace actuel.',
			scoreContribution:
				epssProbability >= 0.7 ? 30 : epssProbability >= 0.3 ? 20 : 5,
		});
	}
	if (isKnownExploited !== null) {
		fallback.push({
			title: isKnownExploited
				? 'Known exploited vulnerability'
				: 'No CISA KEV listing',
			source: 'CISA KEV',
			summary: isKnownExploited
				? 'Une exploitation confirmée constitue un signal déterminant et augmente fortement l’urgence de remédiation.'
				: 'No confirmed exploitation is currently recorded in the CISA KEV catalog.',
			scoreContribution: isKnownExploited ? 40 : 0,
		});
	}

	return fallback.length > 0
		? fallback.slice(0, 4)
		: [
				{
					title: 'Limited intelligence',
					source: 'MM Decision Engine',
					summary:
						'The available normalized signals are incomplete. Validate additional threat and asset context.',
					scoreContribution: 0,
				},
			];
}

function defaultActions(urgency: ReportUrgency): ReportAction[] {
	const priority =
		urgency === 'critical' ? 'Critical' : urgency === 'high' ? 'High' : 'Medium';
	return [
		{
			title: 'Validate asset exposure',
			description:
				'Identify affected assets, confirm vulnerable configurations and determine network reachability.',
			priority,
		},
		{
			title: 'Apply remediation',
			description:
				'Deploy the vendor patch or approved mitigation, beginning with exposed and business-critical systems.',
			priority,
		},
		{
			title: 'Review compensating controls',
			description:
				'Confirm whether segmentation, access controls or security protections reduce practical exploitability.',
			priority: 'High',
		},
		{
			title: 'Increase detection coverage',
			description:
				'Monitor affected systems for exploitation indicators and anomalous activity.',
			priority: urgency === 'critical' ? 'High' : 'Medium',
		},
		{
			title: 'Validate remediation',
			description:
				'Rescan or otherwise verify affected assets and document the residual exposure.',
			priority: 'Medium',
		},
	];
}

function buildConfidenceSummary(
	score: number,
	cvssScore: number | null,
	epssProbability: number | null,
	isKnownExploited: boolean | null,
): string {
	const sources = [
		cvssScore !== null,
		epssProbability !== null,
		isKnownExploited !== null,
	].filter(Boolean).length;

	if (score >= 90 && sources === 3) {
		return 'Confidence is very high because the assessment is supported by complete and corroborated NVD, FIRST EPSS and CISA KEV intelligence.';
	}
	if (sources >= 2) {
		return 'Multiple normalized intelligence sources support the assessment, while asset context remains necessary for the final operational decision.';
	}
	return 'Confidence is limited because one or more normalized intelligence signals are unavailable.';
}

function defaultImpactTitle(urgency: ReportUrgency): string {
	switch (urgency) {
		case 'critical':
			return 'Potentially severe operational exposure';
		case 'high':
			return 'Material business exposure';
		case 'medium':
			return 'Context-dependent business exposure';
		case 'low':
			return 'Limited immediate business exposure';
		default:
			return 'Business impact requires validation';
	}
}

function defaultConsequences(
	urgency: ReportUrgency,
	isKnownExploited: boolean | null,
): string[] {
	if (isKnownExploited === true) {
		return [
			'Compromise of reachable vulnerable systems',
			'Potential lateral movement from an initial foothold',
			'Operational disruption or unauthorized access',
			'Increased incident-response and recovery costs',
		];
	}
	if (urgency === 'critical' || urgency === 'high') {
		return [
			'Unauthorized access to affected systems',
			'Potential loss of confidentiality or integrity',
			'Service degradation or operational disruption',
			'Increased exposure on internet-facing assets',
		];
	}
	return [
		'Impact varies according to asset exposure',
		'Business impact increases on privileged or critical systems',
		'Threat likelihood may change as exploitation intelligence evolves',
	];
}

function setText(root: ParentNode, selector: string, value: string): void {
	const element = root.querySelector<HTMLElement>(selector);
	if (element) element.textContent = value;
}

function setProgress(root: ParentNode, selector: string, value: number): void {
	const element = root.querySelector<HTMLElement>(selector);
	if (element) element.style.width = `${clamp(value, 0, 100)}%`;
}

function asRecord(value: unknown): UnknownRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as UnknownRecord)
		: {};
}

function readString(value: unknown): string {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return '';
}

function normalizeNumber(
	value: unknown,
	minimum: number,
	maximum: number,
): number | null {
	const parsed =
		typeof value === 'number'
			? value
			: typeof value === 'string'
				? Number.parseFloat(value.replace(',', '.').replace('%', '').trim())
				: Number.NaN;
	return Number.isFinite(parsed) ? clamp(parsed, minimum, maximum) : null;
}

function normalizeInteger(
	value: unknown,
	minimum: number,
	maximum: number,
	fallback: number,
): number {
	return Math.round(normalizeNumber(value, minimum, maximum) ?? fallback);
}

function normalizeProbability(value: unknown): number | null {
	const parsed = normalizeNumber(value, 0, 100);
	if (parsed === null) return null;
	return clamp(parsed > 1 ? parsed / 100 : parsed, 0, 1);
}

function normalizeNullableBoolean(value: unknown): boolean | null {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'number') return value !== 0;
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (['true', 'yes', 'listed', 'known', 'confirmed'].includes(normalized)) {
			return true;
		}
		if (['false', 'no', 'not listed'].includes(normalized)) return false;
	}
	return null;
}

function normalizeUrgency(value: string): ReportUrgency {
	const normalized = value.trim().toLowerCase();
	if (normalized.includes('critical') || normalized.includes('immediate')) {
		return 'critical';
	}
	if (normalized.includes('high') || normalized.includes('priority')) return 'high';
	if (normalized.includes('medium') || normalized.includes('plan')) return 'medium';
	if (normalized.includes('low') || normalized.includes('monitor')) return 'low';
	return 'unknown';
}

function normalizeStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) =>
			typeof item === 'string' ? item.trim() : readString(asRecord(item).summary),
		)
		.filter(Boolean);
}

function formatLabel(value: string): string {
	const normalized = value.trim().replaceAll('_', ' ').toLowerCase();
	return normalized
		? normalized.charAt(0).toUpperCase() + normalized.slice(1)
		: tr.common.unknown;
}

function formatPercent(value: number, digits: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'percent',
		maximumFractionDigits: digits,
	}).format(value);
}

function formatDate(value: Date): string {
	return new Intl.DateTimeFormat('fr-FR', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(value);
}

function confidenceFromScore(score: number): string {
	if (score >= 90) return 'VERY_HIGH';
	if (score >= 75) return 'HIGH';
	if (score >= 50) return 'MODERATE';
	if (score > 0) return 'LOW';
	return 'UNAVAILABLE';
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(Math.max(value, minimum), maximum);
}