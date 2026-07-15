import { jsPDF } from 'jspdf';

import type {
	RiskInput,
	RiskResult,
} from './riskEngine';

interface PdfListOptions {
	title: string;
	items: string[];
	emptyMessage: string;
}

const BRAND = {
	navy: [2, 8, 23] as const,
	navyLight: [18, 35, 68] as const,
	blue: [37, 99, 235] as const,
	blueLight: [96, 165, 250] as const,
	white: [255, 255, 255] as const,
	text: [15, 23, 42] as const,
	muted: [71, 85, 105] as const,
	border: [226, 232, 240] as const,
	background: [248, 250, 252] as const,
	green: [22, 163, 74] as const,
	orange: [234, 88, 12] as const,
	red: [220, 38, 38] as const,
};

const ASSET_LABELS: Record<string, string> = {
	workstation: 'Poste utilisateur',
	server: 'Serveur',
	'web-application': 'Application web',
	api: 'API',
	database: 'Base de donnees',
	'active-directory': 'Active Directory',
	cloud: 'Ressource Cloud',
	ot: 'Equipement OT',
};

const EXPOSURE_LABELS: Record<string, string> = {
	internet: 'Internet',
	partner: 'Partenaire / Extranet',
	vpn: 'VPN',
	internal: 'Reseau interne',
	isolated: 'Isole / Segmente',
};

const CRITICALITY_LABELS: Record<number, string> = {
	1: 'Faible',
	2: 'Moderee',
	3: 'Importante',
	4: 'Critique',
};

function yesNo(value: boolean): string {
	return value ? 'Oui' : 'Non';
}

function getAssetLabel(value: string): string {
	return ASSET_LABELS[value] ?? value;
}

function getExposureLabel(value: string): string {
	return EXPOSURE_LABELS[value] ?? value;
}

function getCriticalityLabel(value: number): string {
	return CRITICALITY_LABELS[value] ?? `${value}/4`;
}

function sanitizeFilename(value: string): string {
	const cleanValue = value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase();

	return cleanValue || 'analyse-risque';
}

function getLevelColor(
	level: RiskResult['level']
): readonly [number, number, number] {
	switch (level) {
		case 'Faible':
			return BRAND.green;

		case 'Modéré':
			return BRAND.blue;

		case 'Élevé':
			return BRAND.orange;

		case 'Critique':
			return BRAND.red;
	}
}

export function exportRiskPdf(
	input: RiskInput,
	result: RiskResult
): void {
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4',
		compress: true,
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	const margin = 16;
	const contentWidth = pageWidth - margin * 2;
	const footerLimit = pageHeight - 18;

	let y = 18;
	let pageNumber = 1;

	const setTextColor = (
		color: readonly [number, number, number]
	): void => {
		doc.setTextColor(color[0], color[1], color[2]);
	};

	const setFillColor = (
		color: readonly [number, number, number]
	): void => {
		doc.setFillColor(color[0], color[1], color[2]);
	};

	const setDrawColor = (
		color: readonly [number, number, number]
	): void => {
		doc.setDrawColor(color[0], color[1], color[2]);
	};

	const addFooter = (): void => {
		setDrawColor(BRAND.border);
		doc.setLineWidth(0.25);
		doc.line(
			margin,
			pageHeight - 13,
			pageWidth - margin,
			pageHeight - 13
		);

		doc.setFont('helvetica', 'normal');
		doc.setFontSize(8);
		setTextColor(BRAND.muted);

		doc.text(
			'MM Risk Score - marcmichon.co',
			margin,
			pageHeight - 8
		);

		doc.text(
			`Page ${pageNumber}`,
			pageWidth - margin,
			pageHeight - 8,
			{ align: 'right' }
		);
	};

	const addPage = (): void => {
		addFooter();
		doc.addPage();
		pageNumber += 1;
		y = 18;
	};

	const ensureSpace = (requiredHeight: number): void => {
		if (y + requiredHeight > footerLimit) {
			addPage();
		}
	};

	const writeWrappedText = (
		text: string,
		options?: {
			x?: number;
			maxWidth?: number;
			fontSize?: number;
			lineHeight?: number;
			color?: readonly [number, number, number];
			fontStyle?: 'normal' | 'bold';
		}
	): void => {
		const x = options?.x ?? margin;
		const maxWidth = options?.maxWidth ?? contentWidth;
		const fontSize = options?.fontSize ?? 10;
		const lineHeight = options?.lineHeight ?? 5;
		const color = options?.color ?? BRAND.text;
		const fontStyle = options?.fontStyle ?? 'normal';

		doc.setFont('helvetica', fontStyle);
		doc.setFontSize(fontSize);
		setTextColor(color);

		const lines = doc.splitTextToSize(text, maxWidth) as string[];

		ensureSpace(lines.length * lineHeight + 2);

		doc.text(lines, x, y);
		y += lines.length * lineHeight;
	};

	const addSectionTitle = (title: string): void => {
		ensureSpace(14);

		y += 4;

		setFillColor(BRAND.blue);
		doc.roundedRect(
			margin,
			y - 4,
			3,
			9,
			1,
			1,
			'F'
		);

		doc.setFont('helvetica', 'bold');
		doc.setFontSize(14);
		setTextColor(BRAND.text);

		doc.text(title, margin + 7, y + 2);

		y += 10;
	};

	const addKeyValue = (
		label: string,
		value: string
	): void => {
		ensureSpace(8);

		doc.setFont('helvetica', 'bold');
		doc.setFontSize(9);
		setTextColor(BRAND.muted);
		doc.text(label, margin, y);

		doc.setFont('helvetica', 'normal');
		doc.setFontSize(10);
		setTextColor(BRAND.text);

		const valueLines = doc.splitTextToSize(
			value,
			contentWidth - 58
		) as string[];

		doc.text(valueLines, margin + 58, y);

		y += Math.max(6, valueLines.length * 5);
	};

	const addList = ({
		title,
		items,
		emptyMessage,
	}: PdfListOptions): void => {
		addSectionTitle(title);

		const values =
			items.length > 0 ? items : [emptyMessage];

		for (const item of values) {
			const lines = doc.splitTextToSize(
				item,
				contentWidth - 9
			) as string[];

			ensureSpace(lines.length * 5 + 3);

			setFillColor(BRAND.blue);
			doc.circle(margin + 2, y - 1.2, 0.8, 'F');

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(10);
			setTextColor(BRAND.text);

			doc.text(lines, margin + 7, y);
			y += lines.length * 5 + 2;
		}
	};

	/*
	 * En-tête principal
	 */

	setFillColor(BRAND.navy);
	doc.roundedRect(
		0,
		0,
		pageWidth,
		67,
		0,
		0,
		'F'
	);

	setFillColor(BRAND.blue);
	doc.roundedRect(
		margin,
		14,
		29,
		8,
		2,
		2,
		'F'
	);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8);
	setTextColor(BRAND.white);
	doc.text('MM LABS', margin + 14.5, 19.5, {
		align: 'center',
	});

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(25);
	setTextColor(BRAND.white);
	doc.text('MM Risk Score', margin, 35);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	setTextColor([219, 234, 254]);
	doc.text(
		'Analyse contextualisee d’un scenario de risque cybersecurite',
		margin,
		44
	);

	doc.setFontSize(8.5);
	setTextColor(BRAND.blueLight);
	doc.text(
		'Genere depuis marcmichon.co/labs/risk-matrix',
		margin,
		53
	);

	const levelColor = getLevelColor(result.level);

	setFillColor(levelColor);
	doc.roundedRect(
		pageWidth - margin - 43,
		18,
		43,
		27,
		4,
		4,
		'F'
	);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7.5);
	setTextColor(BRAND.white);
	doc.text(
		'NIVEAU DE RISQUE',
		pageWidth - margin - 21.5,
		25,
		{ align: 'center' }
	);

	doc.setFontSize(15);
	doc.text(
		result.level.toUpperCase(),
		pageWidth - margin - 21.5,
		36,
		{ align: 'center' }
	);

	y = 78;

	/*
	 * Carte du score
	 */

	ensureSpace(44);

	setFillColor(BRAND.background);
	setDrawColor(BRAND.border);
	doc.roundedRect(
		margin,
		y,
		contentWidth,
		38,
		5,
		5,
		'FD'
	);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	setTextColor(BRAND.muted);
	doc.text('MM RISK SCORE', margin + 8, y + 9);

	doc.setFontSize(28);
	setTextColor(BRAND.text);
	doc.text(
		String(result.score),
		margin + 8,
		y + 25
	);

	doc.setFontSize(11);
	setTextColor(BRAND.muted);
	doc.text('/ 100', margin + 28, y + 25);

	const metricX = margin + 65;
	const metricWidth = (contentWidth - 73) / 3;

	const metrics = [
		{
			label: 'Priorite',
			value: result.priority,
		},
		{
			label: 'Delai conseille',
			value: result.deadline,
		},
		{
			label: 'Reduction',
			value: `-${result.controlReduction} pts`,
		},
	];

	metrics.forEach((metric, index) => {
		const x =
			metricX +
			index * (metricWidth + 4);

		setFillColor(BRAND.white);
		setDrawColor(BRAND.border);

		doc.roundedRect(
			x,
			y + 7,
			metricWidth,
			24,
			3,
			3,
			'FD'
		);

		doc.setFont('helvetica', 'bold');
		doc.setFontSize(7.5);
		setTextColor(BRAND.muted);
		doc.text(metric.label, x + 4, y + 14);

		doc.setFontSize(11);
		setTextColor(BRAND.text);
		doc.text(metric.value, x + 4, y + 24);
	});

	y += 48;

	/*
	 * Scénario et contexte
	 */

	addSectionTitle('Scenario');

	writeWrappedText(input.scenario, {
		fontSize: 11,
		lineHeight: 5.5,
		fontStyle: 'bold',
	});

	y += 3;

	addSectionTitle('Contexte');

	addKeyValue(
		'Type d’actif',
		getAssetLabel(input.assetType)
	);

	addKeyValue(
		'Exposition',
		getExposureLabel(input.exposure)
	);

	addKeyValue(
		'Criticite metier',
		getCriticalityLabel(input.criticality)
	);

	/*
	 * Exploitabilité
	 */

	addSectionTitle('Exploitabilite');

	addKeyValue(
		'CVSS',
		`${input.cvss.toFixed(1)}/10`
	);

	addKeyValue(
		'EPSS',
		`${input.epss.toFixed(1)} %`
	);

	addKeyValue(
		'Exploit public',
		yesNo(input.publicExploit)
	);

	addKeyValue(
		'Authentification requise',
		yesNo(input.authenticationRequired)
	);

	addKeyValue(
		'Probabilite calculee',
		`${result.probability}/5`
	);

	/*
	 * Impact
	 */

	addSectionTitle('Impact potentiel');

	addKeyValue(
		'Impact calcule',
		`${result.impact}/5`
	);

	addKeyValue(
		'Donnees sensibles',
		yesNo(input.sensitiveData)
	);

	addKeyValue(
		'Interruption metier',
		yesNo(input.businessInterruption)
	);

	addKeyValue(
		'Privileges eleves',
		yesNo(input.privilegedAccess)
	);

	addKeyValue(
		'Mouvement lateral',
		yesNo(input.lateralMovement)
	);

	/*
	 * Contrôles
	 */

	addSectionTitle('Controles compensatoires');

	addKeyValue('EDR', yesNo(input.controls.edr));
	addKeyValue('WAF', yesNo(input.controls.waf));
	addKeyValue('MFA', yesNo(input.controls.mfa));

	addKeyValue(
		'Segmentation',
		yesNo(input.controls.segmentation)
	);

	addKeyValue(
		'Sauvegardes',
		yesNo(input.controls.backups)
	);

	addKeyValue(
		'Supervision SOC',
		yesNo(input.controls.soc)
	);

	/*
	 * Analyse
	 */

	addSectionTitle('Analyse automatique');

	writeWrappedText(result.summary, {
		fontSize: 10,
		lineHeight: 5.2,
		color: BRAND.text,
	});

	addList({
		title: 'Facteurs augmentant le risque',
		items: result.riskFactors,
		emptyMessage:
			'Aucun facteur aggravant majeur identifie.',
	});

	addList({
		title: 'Controles protecteurs',
		items: result.protectiveFactors,
		emptyMessage:
			'Aucun controle compensatoire declare.',
	});

	addSectionTitle('Priorites recommandees');

	const recommendations =
		result.recommendations.length > 0
			? result.recommendations
			: [
					'Documenter le scenario et organiser une revue du risque.',
				];

	recommendations.forEach(
		(recommendation, index) => {
			const lines = doc.splitTextToSize(
				recommendation,
				contentWidth - 15
			) as string[];

			ensureSpace(lines.length * 5 + 8);

			setFillColor(BRAND.blue);
			doc.circle(margin + 4, y - 1, 3, 'F');

			doc.setFont('helvetica', 'bold');
			doc.setFontSize(8);
			setTextColor(BRAND.white);

			doc.text(
				String(index + 1),
				margin + 4,
				y,
				{ align: 'center' }
			);

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(10);
			setTextColor(BRAND.text);

			doc.text(lines, margin + 11, y);
			y += lines.length * 5 + 4;
		}
	);

	/*
	 * Avertissement final
	 */

	ensureSpace(34);
	y += 5;

	setFillColor([239, 246, 255]);
	setDrawColor([147, 197, 253]);

	doc.roundedRect(
		margin,
		y,
		contentWidth,
		28,
		4,
		4,
		'FD'
	);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8);
	setTextColor(BRAND.blue);

	doc.text(
		'METHODE D’AIDE A LA DECISION',
		margin + 6,
		y + 8
	);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	setTextColor(BRAND.text);

	const warningLines = doc.splitTextToSize(
		'Le MM Risk Score fournit une estimation contextualisee. Il ne remplace pas une analyse de risque complete et ne constitue pas un standard officiel.',
		contentWidth - 12
	) as string[];

	doc.text(
		warningLines,
		margin + 6,
		y + 15
	);

	addFooter();

	const date = new Date()
		.toISOString()
		.slice(0, 10);

	const filename =
		`mm-risk-score-${sanitizeFilename(input.scenario)}-${date}.pdf`;

	doc.save(filename);
}