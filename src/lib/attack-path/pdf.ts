import { jsPDF } from 'jspdf';

// MM Attack Path Explorer PDF V3.8 — Final Flow & 3-Page Edition

export type AttackPathTone = 'entry' | 'asset' | 'identity' | 'privilege' | 'critical';

export interface AttackPathPdfNode {
	type: string;
	name: string;
	tone: AttackPathTone;
}

export interface AttackPathPdfRelation {
	label: string;
}

export interface AttackPathPdfRemediation {
	title: string;
	beforeScore: number;
	afterScore: number;
	reduction: number;
	remainingPaths: number;
	message: string;
}

export interface AttackPathPdfReport {
	mode: 'Explore scenario' | 'Guided builder' | 'Custom builder';
	scenario: string;
	score: number;
	severity: string;
	context: string;
	chokePoint: string;
	nodes: AttackPathPdfNode[];
	relations: AttackPathPdfRelation[];
	generatedAt?: Date;
	remediation?: AttackPathPdfRemediation | null;
}

type Color = readonly [number, number, number];

type Recommendation = {
	priority: 'P1' | 'P2' | 'P3';
	title: string;
	objective: string;
	action: string;
	effect: string;
	accent: Color;
};

const PAGE = {
	width: 210,
	height: 297,
	margin: 15,
	footerY: 285,
} as const;

const COLORS = {
	navy: [4, 15, 35] as const,
	navySoft: [14, 31, 58] as const,
	navyCard: [9, 24, 48] as const,
	blue: [37, 99, 235] as const,
	cyan: [6, 182, 212] as const,
	blueSoft: [232, 240, 254] as const,
	blueLine: [147, 197, 253] as const,
	white: [255, 255, 255] as const,
	text: [21, 32, 51] as const,
	muted: [76, 91, 113] as const,
	mutedLight: [148, 163, 184] as const,
	border: [214, 223, 234] as const,
	surface: [247, 249, 252] as const,
	green: [22, 163, 74] as const,
	greenSoft: [236, 253, 245] as const,
	amber: [217, 119, 6] as const,
	amberSoft: [255, 251, 235] as const,
	red: [220, 38, 38] as const,
	redSoft: [254, 242, 242] as const,
	purple: [124, 58, 237] as const,
	purpleSoft: [245, 243, 255] as const,
	rose: [225, 29, 72] as const,
	roseSoft: [255, 241, 242] as const,
} as const;

const TOTAL_PAGES_TOKEN = '{total_pages_count_string}';

interface PdfContext {
	doc: jsPDF;
	data: AttackPathPdfReport;
}

export function exportAttackPathPdf(input: AttackPathPdfReport): void {
	const data: AttackPathPdfReport = {
		...input,
		generatedAt: input.generatedAt ?? new Date(),
		nodes: input.nodes.slice(0, 8),
		relations: input.relations.slice(0, 7),
	};

	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4',
		compress: true,
	});

	const context: PdfContext = { doc, data };
	drawExecutivePage(context);
	doc.addPage();
	drawPathPage(context);
	doc.addPage();
	drawRemediationPage(context);

	if (typeof doc.putTotalPages === 'function') {
		doc.putTotalPages(TOTAL_PAGES_TOKEN);
	}

	const date = data.generatedAt!.toISOString().slice(0, 10);
	const target = data.nodes.at(-1)?.name || data.scenario || 'attack-path';
	doc.save(`mm-attack-path-${sanitizeFilename(target)}-${date}.pdf`);
}

function drawExecutivePage({ doc, data }: PdfContext): void {
	const severityColor = getSeverityColor(data.score);

	setFill(doc, COLORS.navy);
	doc.rect(0, 0, PAGE.width, 82, 'F');

	setFill(doc, COLORS.blue);
	doc.roundedRect(PAGE.margin, 13, 29, 7, 2, 2, 'F');
	text(doc, 'MM LABS', PAGE.margin + 14.5, 17.8, {
		fontSize: 7.5,
		fontStyle: 'bold',
		color: COLORS.white,
		align: 'center',
	});

	text(doc, 'MM Security Intelligence', PAGE.margin, 34, {
		fontSize: 23,
		fontStyle: 'bold',
		color: COLORS.white,
	});
	text(doc, 'Attack Path Analysis', PAGE.margin, 45, {
		fontSize: 13,
		fontStyle: 'bold',
		color: COLORS.white,
	});
	text(doc, data.scenario, PAGE.margin, 57, {
		fontSize: 11,
		fontStyle: 'bold',
		color: COLORS.blueLine,
	});
	text(doc, `Rapport genere depuis MM Attack Path Explorer · ${data.mode}`, PAGE.margin, 66, {
		fontSize: 8.2,
		color: [208, 221, 240],
	});

	setFill(doc, severityColor);
	doc.roundedRect(PAGE.width - PAGE.margin - 48, 15, 48, 38, 4, 4, 'F');
	text(doc, 'ATTACK PATH SCORE', PAGE.width - PAGE.margin - 24, 24, {
		fontSize: 6.4,
		fontStyle: 'bold',
		color: COLORS.white,
		align: 'center',
	});
	text(doc, String(data.score), PAGE.width - PAGE.margin - 24, 39, {
		fontSize: 24,
		fontStyle: 'bold',
		color: COLORS.white,
		align: 'center',
	});
	text(doc, data.severity.toUpperCase(), PAGE.width - PAGE.margin - 24, 48, {
		fontSize: 7,
		fontStyle: 'bold',
		color: COLORS.white,
		align: 'center',
	});

	let y = 92;
	const metricW = (180 - 8) / 3;
	drawMetric(doc, PAGE.margin, y, metricW, 'NODES', String(data.nodes.length), COLORS.blue);
	drawMetric(doc, PAGE.margin + metricW + 4, y, metricW, 'RELATIONS', String(data.relations.length), COLORS.cyan);
	drawMetric(doc, PAGE.margin + (metricW + 4) * 2, y, metricW, 'MODE', shortMode(data.mode), severityColor);

	y += 46;
	drawSectionHeader(doc, '01', 'Attack path overview', y);
	y += 15;

	const miniGraphHeight = drawExecutiveMiniPath(doc, data, PAGE.margin, y, 180);
	y += miniGraphHeight + 11;

	drawSectionHeader(doc, '02', 'Contexte et point de rupture', y);
	y += 14;

	const leftW = 88;
	const rightW = 88;
	const contextH = Math.max(44, measureTextHeight(doc, data.context, leftW - 14, 8.1, 4.2) + 24);
	card(doc, PAGE.margin, y, leftW, contextH);
	text(doc, 'PATH CONTEXT', PAGE.margin + 7, y + 10, {
		fontSize: 6.4,
		fontStyle: 'bold',
		color: COLORS.blue,
	});
	wrappedText(doc, data.context, PAGE.margin + 7, y + 20, leftW - 14, {
		fontSize: 8.1,
		lineHeight: 4.2,
		color: COLORS.text,
	});

	setFill(doc, COLORS.greenSoft);
	setDraw(doc, COLORS.green);
	doc.roundedRect(PAGE.margin + leftW + 4, y, rightW, contextH, 5, 5, 'FD');
	text(doc, 'RECOMMENDED', PAGE.margin + leftW + 11, y + 10, {
		fontSize: 6.1,
		fontStyle: 'bold',
		color: COLORS.green,
	});
	text(doc, 'CHOKE POINT', PAGE.margin + leftW + 11, y + 17, {
		fontSize: 6.1,
		fontStyle: 'bold',
		color: COLORS.green,
	});
	wrappedText(doc, safeChokePoint(data), PAGE.margin + leftW + 11, y + 25, rightW - 14, {
		fontSize: 9,
		lineHeight: 4.5,
		fontStyle: 'bold',
		color: COLORS.text,
	});

	drawFooter(doc);
}

function drawExecutiveMiniPath(doc: jsPDF, data: AttackPathPdfReport, x: number, y: number, width: number): number {
	setFill(doc, COLORS.navyCard);
	setDraw(doc, COLORS.navySoft);

	const visibleNodes = buildExecutiveNodes(data.nodes);
	const count = visibleNodes.length;
	const sidePadding = 7;
	const innerWidth = width - sidePadding * 2;
	const gap = count <= 5 ? 7 : 5;
	const nodeW = (innerWidth - gap * (count - 1)) / count;
	const nodeH = 22;
	const relationH = 8;
	const boxH = 51;

	doc.roundedRect(x, y, width, boxH, 5, 5, 'FD');
	text(doc, 'PATH FLOW', x + 8, y + 8, {
		fontSize: 5.9, fontStyle: 'bold', color: COLORS.cyan,
	});

	const nodeY = y + 12;
	const relationY = nodeY + nodeH + 4;

	visibleNodes.forEach((item, index) => {
		const nodeX = x + sidePadding + index * (nodeW + gap);
		const toneColor = item.kind === 'ellipsis' ? COLORS.mutedLight : getToneColor(item.node.tone);

		if (item.kind === 'ellipsis') {
			setFill(doc, COLORS.navySoft);
			setDraw(doc, COLORS.mutedLight);
			doc.roundedRect(nodeX, nodeY, nodeW, nodeH, 4, 4, 'FD');
			text(doc, `+${item.hiddenCount}`, nodeX + nodeW / 2, nodeY + 10, {
				fontSize: 9, fontStyle: 'bold', color: COLORS.white, align: 'center',
			});
			text(doc, 'NODES', nodeX + nodeW / 2, nodeY + 17, {
				fontSize: 4.6, fontStyle: 'bold', color: COLORS.mutedLight, align: 'center',
			});
		} else {
			setFill(doc, [8, 22, 44]);
			setDraw(doc, toneColor);
			doc.roundedRect(nodeX, nodeY, nodeW, nodeH, 4, 4, 'FD');
			setFill(doc, toneColor);
			doc.roundedRect(nodeX + 3, nodeY + 3.2, Math.min(8.5, nodeW - 6), 1.8, 1, 1, 'F');

			text(doc, truncateToWidth(doc, item.node.type.toUpperCase(), nodeW - 6, 4.7, 'bold'), nodeX + 3, nodeY + 9.6, {
				fontSize: 4.7, fontStyle: 'bold', color: toneColor,
			});
			wrappedText(doc, item.node.name, nodeX + 3, nodeY + 15.8, nodeW - 6, {
				fontSize: 6.2, lineHeight: 2.9, fontStyle: 'bold', color: COLORS.white,
			});
		}

		// Dedicated relation row: centered between source and destination nodes.
		if (index < visibleNodes.length - 1 && index < data.relations.length) {
			const nextX = x + sidePadding + (index + 1) * (nodeW + gap);
			const sourceCenter = nodeX + nodeW / 2;
			const targetCenter = nextX + nodeW / 2;
			const relationCenter = (sourceCenter + targetCenter) / 2;
			const relation = data.relations[index]?.label || 'Relationship';
			const isChoke = index === findChokeRelationIndex(data);
			const accent = isChoke ? COLORS.green : COLORS.blueLine;

			setDraw(doc, accent);
			doc.setLineWidth(isChoke ? 0.7 : 0.4);
			doc.line(sourceCenter + nodeW / 2 - 1.5, nodeY + nodeH / 2, targetCenter - nodeW / 2 + 1.5, nodeY + nodeH / 2);

			// Width is based on the interval between node centers, allowing the full label.
			const slotW = Math.max(25, targetCenter - sourceCenter - 2);
			const label = truncateToWidth(doc, relation, slotW - 4, 4.45, 'bold');
			const pillW = Math.min(slotW, Math.max(22, measureTextWidth(doc, label, 4.45, 'bold') + 5));

			setFill(doc, isChoke ? COLORS.greenSoft : COLORS.navySoft);
			setDraw(doc, isChoke ? COLORS.green : COLORS.blueLine);
			doc.roundedRect(relationCenter - pillW / 2, relationY, pillW, relationH, 2.2, 2.2, 'FD');
			text(doc, label, relationCenter, relationY + 5.2, {
				fontSize: 4.45, fontStyle: 'bold',
				color: isChoke ? COLORS.green : COLORS.white, align: 'center',
			});
		}
	});

	return boxH;
}

function buildExecutiveNodes(nodes: AttackPathPdfNode[]): Array<
	| { kind: 'node'; node: AttackPathPdfNode }
	| { kind: 'ellipsis'; hiddenCount: number }
> {
	if (nodes.length <= 5) return nodes.map((node) => ({ kind: 'node' as const, node }));
	return [
		{ kind: 'node' as const, node: nodes[0] },
		{ kind: 'node' as const, node: nodes[1] },
		{ kind: 'ellipsis' as const, hiddenCount: nodes.length - 4 },
		{ kind: 'node' as const, node: nodes[nodes.length - 2] },
		{ kind: 'node' as const, node: nodes[nodes.length - 1] },
	];
}

function drawPathPage({ doc, data }: PdfContext): void {
	drawPageHeader(doc, data, 'Attack path detail', 'Nodes, relations et progression vers la cible');

	let y = 34;
	wrappedText(doc, 'Lecture structuree du chemin exporte. Chaque relation represente une possibilite de progression ou d’escalade entre deux objets.', PAGE.margin, y, 180, {
		fontSize: 8.4,
		lineHeight: 4.4,
		color: COLORS.muted,
	});
	y += 14;

	const chokeRelationIndex = findChokeRelationIndex(data);

	for (let index = 0; index < data.nodes.length; index += 1) {
		const node = data.nodes[index];
		const toneColor = getToneColor(node.tone);
		const nodeH = 21;

		setFill(doc, COLORS.white);
		setDraw(doc, toneColor);
		doc.roundedRect(PAGE.margin + 8, y, 164, nodeH, 5, 5, 'FD');
		setFill(doc, toneColor);
		doc.roundedRect(PAGE.margin + 8, y, 18, nodeH, 5, 0, 'F');
		text(doc, String(index + 1).padStart(2, '0'), PAGE.margin + 17, y + 12.8, {
			fontSize: 7.5,
			fontStyle: 'bold',
			color: COLORS.white,
			align: 'center',
		});
		text(doc, node.type.toUpperCase(), PAGE.margin + 32, y + 7, {
			fontSize: 5.9,
			fontStyle: 'bold',
			color: toneColor,
		});
		wrappedText(doc, node.name, PAGE.margin + 32, y + 14.5, 132, {
			fontSize: 9.3,
			lineHeight: 4.2,
			fontStyle: 'bold',
			color: COLORS.text,
		});
		y += nodeH;

		if (index < data.relations.length) {
			const relation = data.relations[index];
			const isChoke = index === chokeRelationIndex;
			const accent = isChoke ? COLORS.green : COLORS.blueLine;

			setDraw(doc, accent);
			doc.setLineWidth(isChoke ? 0.8 : 0.4);
			doc.line(PAGE.margin + 90, y + 1, PAGE.margin + 90, y + 9);

			const label = relation.label || 'Relationship';
			const pillText = isChoke ? `${label} · CHOKE POINT` : label;
			const pillW = Math.min(112, Math.max(46, measureTextWidth(doc, pillText, 6.6, 'bold') + 16));
			setFill(doc, isChoke ? COLORS.greenSoft : COLORS.navyCard);
			setDraw(doc, isChoke ? COLORS.green : COLORS.navySoft);
			doc.roundedRect(PAGE.margin + 90 - pillW / 2, y + 4.2, pillW, 10, 3, 3, 'FD');
			text(doc, pillText, PAGE.margin + 90, y + 10.9, {
				fontSize: 6.6,
				fontStyle: 'bold',
				color: isChoke ? COLORS.green : COLORS.white,
				align: 'center',
			});

			y += 17;
		}

		if (y > PAGE.footerY - 29 && index < data.nodes.length - 1) {
			drawFooter(doc);
			doc.addPage();
			drawPageHeader(doc, data, 'Attack path detail', 'Suite');
			y = 34;
		}
	}

	const finalNode = data.nodes.at(-1);
	if (finalNode && y + 32 < PAGE.footerY) {
		y += 3;
		setFill(doc, getSeveritySoftColor(data.score));
		setDraw(doc, getSeverityColor(data.score));
		doc.roundedRect(PAGE.margin, y, 180, 22, 5, 5, 'FD');
		text(doc, 'FINAL REACHABILITY', PAGE.margin + 8, y + 8, {
			fontSize: 6.1,
			fontStyle: 'bold',
			color: getSeverityColor(data.score),
		});
		wrappedText(doc, `${finalNode.name} est atteignable via ${data.relations.length} relation(s) dans le chemin exporte. Score courant : ${data.score}/100 (${data.severity}).`, PAGE.margin + 8, y + 16, 164, {
			fontSize: 7.7,
			lineHeight: 4.0,
			fontStyle: 'bold',
			color: COLORS.text,
		});
	}

	drawFooter(doc);
}

function drawRemediationPage({ doc, data }: PdfContext): void {
	drawPageHeader(doc, data, 'Remediation plan', 'Prioriser les actions qui cassent la progression vers la cible critique');

	let y = 34;
	drawSectionHeader(doc, '01', 'Point de rupture recommande', y);
	y += 12;

	setFill(doc, COLORS.greenSoft);
	setDraw(doc, COLORS.green);
	doc.roundedRect(PAGE.margin, y, 180, 26, 5, 5, 'FD');
	text(doc, 'CHOKE POINT', PAGE.margin + 8, y + 8, {
		fontSize: 6.1,
		fontStyle: 'bold',
		color: COLORS.green,
	});
	wrappedText(doc, safeChokePoint(data), PAGE.margin + 8, y + 17, 164, {
		fontSize: 10.2,
		lineHeight: 4.6,
		fontStyle: 'bold',
		color: COLORS.text,
	});
	y += 28;

	if (data.remediation) {
		drawSectionHeader(doc, '02', 'Simulation et plan d’action', y);
		y += 12;
		y += drawSimulationPanel(doc, data.remediation, y) + 5;
	} else {
		drawSectionHeader(doc, '02', 'Plan d’action priorise', y);
		y += 12;
	}

	const recommendations = buildRecommendations(data);
	for (let index = 0; index < recommendations.length; index += 1) {
		const h = measureRecommendationHeight(doc, recommendations[index]);
		if (y + h > PAGE.footerY - 40) {
			drawFooter(doc);
			doc.addPage();
			drawPageHeader(doc, data, 'Remediation plan', 'Suite du plan d’action');
			y = 34;
		}
		drawRecommendation(doc, recommendations[index], y);
		y += h + 3.5;
	}

	if (y + 33 > PAGE.footerY - 3) {
		drawFooter(doc);
		doc.addPage();
		drawPageHeader(doc, data, 'Remediation plan', 'Validation operationnelle');
		y = 34;
	}

	drawSectionHeader(doc, '03', 'Validation operationnelle', y);
	y += 10;
	setFill(doc, COLORS.surface);
	setDraw(doc, COLORS.border);
	doc.roundedRect(PAGE.margin, y, 180, 28, 5, 5, 'FD');

	const checks = [
		'Confirmer le perimetre et la realite de chaque relation.',
		'Prioriser la rupture du choke point avant les corrections secondaires.',
		'Rejouer le chemin apres remediation pour confirmer la perte de reachability.',
		'Conserver la preuve du changement et du controle post-remediation.',
	];
	checks.forEach((item, index) => drawCompactCheck(doc, PAGE.margin + 7, y + 6.8 + index * 5.8, item));

	drawFooter(doc);
}

function drawSimulationPanel(doc: jsPDF, remediation: AttackPathPdfRemediation, y: number): number {
	const h = 58;
	card(doc, PAGE.margin, y, 180, h);
	text(doc, remediation.title, PAGE.margin + 8, y + 12, {
		fontSize: 11,
		fontStyle: 'bold',
		color: COLORS.text,
	});

	const metricW = (164 - 8) / 3;
	drawMetric(doc, PAGE.margin + 8, y + 18, metricW, 'RISK', `${remediation.beforeScore} -> ${remediation.afterScore}`, COLORS.green);
	drawMetric(doc, PAGE.margin + 8 + metricW + 4, y + 18, metricW, 'REDUCTION', `${remediation.reduction}%`, COLORS.green);
	drawMetric(doc, PAGE.margin + 8 + (metricW + 4) * 2, y + 18, metricW, 'PATHS', String(remediation.remainingPaths), COLORS.blue);

	setFill(doc, COLORS.greenSoft);
	setDraw(doc, COLORS.green);
	doc.roundedRect(PAGE.margin + 8, y + 45, 164, 9, 3, 3, 'FD');
	text(doc, 'SIMULATION RESULT', PAGE.margin + 13, y + 50.8, {
		fontSize: 6.1,
		fontStyle: 'bold',
		color: COLORS.green,
	});
	text(doc, truncateToWidth(doc, remediation.message, 123, 6.5), PAGE.margin + 46, y + 50.8, {
		fontSize: 6.9,
		color: COLORS.text,
	});
	return h;
}

function buildRecommendations(data: AttackPathPdfReport): Recommendation[] {
	const relations = data.relations.map((item) => item.label.toLowerCase()).join(' ');
	const target = data.nodes.at(-1)?.name || 'la cible critique';
	const recommendations: Recommendation[] = [];

	const choke = safeChokePoint(data);
	recommendations.push({
		priority: 'P1',
		title: 'Casser la relation determinante',
		objective: 'Interrompre la progression end-to-end vers la cible critique.',
		action: `Revoir et supprimer, restreindre ou segmenter la relation ${choke}. Valider les dependances avant changement et conserver une procedure de retour arriere.`,
		effect: `Effet attendu : ${target} ne doit plus etre atteignable par le chemin exporte.`,
		accent: COLORS.green,
	});

	if (/credential|account|session|logon|token/.test(relations)) {
		recommendations.push({
			priority: 'P2',
			title: 'Reduire l’exposition des identites',
			objective: 'Limiter les opportunites de reutilisation de comptes, sessions ou jetons.',
			action: 'Rotation des secrets concernes, revocation des sessions persistantes, reduction des droits permanents et revue des comptes privilegies exposes dans le chemin.',
			effect: 'Effet attendu : diminution des transitions exploitables reposant sur des identites compromises.',
			accent: COLORS.purple,
		});
	} else if (/exploit|public|remote|phishing/.test(relations)) {
		recommendations.push({
			priority: 'P2',
			title: 'Durcir le point d’entree',
			objective: 'Reduire la probabilite de compromission initiale.',
			action: 'Corriger les services exposes, restreindre les acces distants, renforcer les controles d’authentification et appliquer les mesures compensatoires disponibles.',
			effect: 'Effet attendu : baisse de l’exposition initiale sans masquer les relations internes restantes.',
			accent: COLORS.blue,
		});
	} else {
		recommendations.push({
			priority: 'P2',
			title: 'Reduire les privileges transverses',
			objective: 'Limiter les chemins secondaires de mouvement lateral et d’escalade.',
			action: 'Revoir les droits d’administration, les groupes privilegies, les delegations et les acces persistants entre objets du chemin.',
			effect: 'Effet attendu : reduction du nombre de relations reutilisables par un attaquant.',
			accent: COLORS.amber,
		});
	}

	recommendations.push({
		priority: 'P3',
		title: 'Isoler et surveiller la cible critique',
		objective: 'Reduire le blast radius si une autre route reste exploitable.',
		action: 'Segmenter les actifs critiques, limiter les flux est-ouest aux seuls echanges necessaires et superviser les relations privilegiees menant a la cible.',
		effect: 'Effet attendu : diminution de la reachability residuelle et meilleure detection des tentatives de progression.',
		accent: COLORS.rose,
	});

	return recommendations;
}

function measureRecommendationHeight(doc: jsPDF, recommendation: Recommendation): number {
	const bodyW = 148;
	const objectiveH = measureTextHeight(doc, recommendation.objective, bodyW, 6.5, 3.3);
	const actionH = measureTextHeight(doc, recommendation.action, bodyW, 6.5, 3.3);
	const effectTextH = measureTextHeight(doc, recommendation.effect, bodyW - 10, 6.2, 3.2, 'bold');
	const effectBoxH = Math.max(9, effectTextH + 5.5);
	return Math.max(40, 18 + objectiveH + actionH + effectBoxH + 8);
}

function drawRecommendation(doc: jsPDF, recommendation: Recommendation, y: number): void {
	const h = measureRecommendationHeight(doc, recommendation);
	const railW = 18;
	const bodyX = PAGE.margin + railW + 6;
	const bodyW = 180 - railW - 12;

	setFill(doc, COLORS.white);
	setDraw(doc, COLORS.border);
	doc.roundedRect(PAGE.margin, y, 180, h, 5, 5, 'FD');
	setFill(doc, COLORS.navyCard);
	doc.roundedRect(PAGE.margin, y, railW, h, 5, 0, 'F');

	setFill(doc, recommendation.accent);
	doc.roundedRect(PAGE.margin + 4.5, y + 5, 9, 5.2, 1.7, 1.7, 'F');
	text(doc, recommendation.priority, PAGE.margin + 9, y + 8.7, {
		fontSize: 5.8, fontStyle: 'bold', color: COLORS.white, align: 'center',
	});
	text(doc, 'ACTION', PAGE.margin + 9, y + 16.5, {
		fontSize: 5.0, fontStyle: 'bold', color: COLORS.mutedLight, align: 'center',
	});

	text(doc, recommendation.title, bodyX, y + 8.5, {
		fontSize: 8.8, fontStyle: 'bold', color: COLORS.text,
	});

	let cursor = y + 15;
	text(doc, 'OBJECTIF', bodyX, cursor, {
		fontSize: 5.4, fontStyle: 'bold', color: recommendation.accent,
	});
	cursor += 4.5;
	cursor += wrappedText(doc, recommendation.objective, bodyX, cursor, bodyW, {
		fontSize: 6.5, lineHeight: 3.3, color: COLORS.muted,
	}) + 1.8;

	text(doc, 'ACTION', bodyX, cursor, {
		fontSize: 5.4, fontStyle: 'bold', color: recommendation.accent,
	});
	cursor += 4.5;
	cursor += wrappedText(doc, recommendation.action, bodyX, cursor, bodyW, {
		fontSize: 6.5, lineHeight: 3.3, color: COLORS.text,
	}) + 2.2;

	const effectH = Math.max(9, measureTextHeight(doc, recommendation.effect, bodyW - 10, 6.2, 3.2, 'bold') + 5.5);
	setFill(doc, toneSoftColor(recommendation.accent));
	setDraw(doc, recommendation.accent);
	doc.roundedRect(bodyX, cursor, bodyW, effectH, 2.5, 2.5, 'FD');
	wrappedText(doc, recommendation.effect, bodyX + 5, cursor + 5.1, bodyW - 10, {
		fontSize: 6.2, lineHeight: 3.2, fontStyle: 'bold', color: COLORS.text,
	});
}

function drawCompactCheck(doc: jsPDF, x: number, y: number, label: string): void {
	setDraw(doc, COLORS.blue);
	doc.setLineWidth(0.3);
	doc.roundedRect(x, y - 2.6, 3.1, 3.1, 0.6, 0.6, 'S');
	text(doc, truncateToWidth(doc, label, 161, 6.2), x + 5.5, y, {
		fontSize: 6.2, color: COLORS.text,
	});
}

function findChokeRelationIndex(data: AttackPathPdfReport): number {
	const normalized = normalizeArrowText(data.chokePoint).toLowerCase();
	for (let index = 0; index < data.nodes.length - 1; index += 1) {
		const left = data.nodes[index]?.name.toLowerCase();
		const right = data.nodes[index + 1]?.name.toLowerCase();
		if (left && right && normalized.includes(left) && normalized.includes(right)) return index;
	}
	return Math.max(0, Math.min(data.relations.length - 1, Math.floor((data.relations.length - 1) / 2)));
}

function drawPageHeader(doc: jsPDF, data: AttackPathPdfReport, titleValue: string, subtitle: string): void {
	setFill(doc, COLORS.navy);
	doc.rect(0, 0, PAGE.width, 25, 'F');
	text(doc, titleValue, PAGE.margin, 11, {
		fontSize: 14,
		fontStyle: 'bold',
		color: COLORS.white,
	});
	text(doc, subtitle, PAGE.margin, 18, {
		fontSize: 7.5,
		color: [203, 216, 235],
	});
	text(doc, `${data.score}/100`, PAGE.width - PAGE.margin, 12, {
		fontSize: 9,
		fontStyle: 'bold',
		color: getSeverityColor(data.score),
		align: 'right',
	});
}

function drawFooter(doc: jsPDF): void {
	setDraw(doc, COLORS.border);
	doc.setLineWidth(0.2);
	doc.line(PAGE.margin, PAGE.footerY - 4, PAGE.width - PAGE.margin, PAGE.footerY - 4);
	text(doc, 'MM Security Intelligence · Attack Path Explorer · marcmichon.co', PAGE.margin, PAGE.footerY, {
		fontSize: 7,
		color: COLORS.mutedLight,
	});
	text(doc, `Page ${doc.getCurrentPageInfo().pageNumber} / ${TOTAL_PAGES_TOKEN}`, PAGE.width - PAGE.margin, PAGE.footerY, {
		fontSize: 7,
		color: COLORS.mutedLight,
		align: 'right',
	});
}

function drawSectionHeader(doc: jsPDF, number: string, titleValue: string, y: number): void {
	setFill(doc, COLORS.blueSoft);
	setDraw(doc, COLORS.blueLine);
	doc.roundedRect(PAGE.margin, y, 11, 9, 2.5, 2.5, 'FD');
	text(doc, number, PAGE.margin + 5.5, y + 5.8, {
		fontSize: 6.5,
		fontStyle: 'bold',
		color: COLORS.blue,
		align: 'center',
	});
	text(doc, titleValue, PAGE.margin + 16, y + 6.2, {
		fontSize: 11.5,
		fontStyle: 'bold',
		color: COLORS.text,
	});
}

function drawMetric(doc: jsPDF, x: number, y: number, width: number, label: string, value: string, accent: Color): void {
	setFill(doc, COLORS.navyCard);
	setDraw(doc, COLORS.navySoft);
	doc.roundedRect(x, y, width, 35, 5, 5, 'FD');
	setFill(doc, accent);
	doc.roundedRect(x + 6, y + 6, 10, 3, 1.5, 1.5, 'F');
	text(doc, label, x + 6, y + 15, {
		fontSize: 6.2,
		fontStyle: 'bold',
		color: [175, 193, 218],
	});
	wrappedText(doc, value, x + 6, y + 24, width - 12, {
		fontSize: 10,
		lineHeight: 4.6,
		fontStyle: 'bold',
		color: COLORS.white,
	});
}

function drawCheckbox(doc: jsPDF, x: number, y: number, label: string): void {
	setDraw(doc, COLORS.blue);
	doc.setLineWidth(0.35);
	doc.roundedRect(x, y - 3.2, 4, 4, 0.7, 0.7, 'S');
	wrappedText(doc, label, x + 8, y, 157, {
		fontSize: 7.4,
		lineHeight: 3.9,
		color: COLORS.text,
	});
}

function card(doc: jsPDF, x: number, y: number, width: number, height: number): void {
	setFill(doc, COLORS.white);
	setDraw(doc, COLORS.border);
	doc.roundedRect(x, y, width, height, 4, 4, 'FD');
}

function text(
	doc: jsPDF,
	value: string,
	x: number,
	y: number,
	options: {
		fontSize: number;
		fontStyle?: 'normal' | 'bold';
		color?: Color;
		align?: 'left' | 'center' | 'right';
	},
): void {
	doc.setFont('helvetica', options.fontStyle ?? 'normal');
	doc.setFontSize(options.fontSize);
	setText(doc, options.color ?? COLORS.text);
	doc.text(sanitizePdfText(value), x, y, { align: options.align ?? 'left' });
}

function wrappedText(
	doc: jsPDF,
	value: string,
	x: number,
	y: number,
	width: number,
	options: {
		fontSize: number;
		lineHeight: number;
		fontStyle?: 'normal' | 'bold';
		color?: Color;
		align?: 'left' | 'center' | 'right';
	},
): number {
	doc.setFont('helvetica', options.fontStyle ?? 'normal');
	doc.setFontSize(options.fontSize);
	setText(doc, options.color ?? COLORS.text);
	const lines = doc.splitTextToSize(sanitizePdfText(value), width) as string[];
	const align = options.align ?? 'left';
	const anchorX = align === 'center' ? x + width / 2 : align === 'right' ? x + width : x;
	lines.forEach((line, index) => doc.text(line, anchorX, y + index * options.lineHeight, { align }));
	return lines.length * options.lineHeight;
}

function measureTextHeight(
	doc: jsPDF,
	value: string,
	width: number,
	fontSize: number,
	lineHeight: number,
	fontStyle: 'normal' | 'bold' = 'normal',
): number {
	doc.setFont('helvetica', fontStyle);
	doc.setFontSize(fontSize);
	return (doc.splitTextToSize(sanitizePdfText(value), width) as string[]).length * lineHeight;
}

function measureTextWidth(doc: jsPDF, value: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal'): number {
	doc.setFont('helvetica', fontStyle);
	doc.setFontSize(fontSize);
	return doc.getTextWidth(sanitizePdfText(value));
}

function truncateToWidth(
	doc: jsPDF,
	value: string,
	width: number,
	fontSize: number,
	fontStyle: 'normal' | 'bold' = 'normal',
): string {
	doc.setFont('helvetica', fontStyle);
	doc.setFontSize(fontSize);
	const clean = sanitizePdfText(value);
	if (doc.getTextWidth(clean) <= width) return clean;
	let shortened = clean;
	while (shortened.length > 1 && doc.getTextWidth(`${shortened}...`) > width) {
		shortened = shortened.slice(0, -1);
	}
	return `${shortened.trimEnd()}...`;
}

function setText(doc: jsPDF, color: Color): void {
	doc.setTextColor(...color);
}

function setFill(doc: jsPDF, color: Color): void {
	doc.setFillColor(...color);
}

function setDraw(doc: jsPDF, color: Color): void {
	doc.setDrawColor(...color);
}

function getSeverityColor(score: number): Color {
	if (score >= 85) return COLORS.red;
	if (score >= 70) return COLORS.amber;
	if (score >= 50) return COLORS.blue;
	return COLORS.green;
}

function getSeveritySoftColor(score: number): Color {
	if (score >= 85) return COLORS.redSoft;
	if (score >= 70) return COLORS.amberSoft;
	if (score >= 50) return COLORS.blueSoft;
	return COLORS.greenSoft;
}

function getToneColor(tone: AttackPathTone): Color {
	switch (tone) {
		case 'identity':
			return COLORS.purple;
		case 'privilege':
			return COLORS.amber;
		case 'critical':
			return COLORS.rose;
		case 'entry':
			return COLORS.mutedLight;
		default:
			return COLORS.blue;
	}
}

function toneSoftColor(accent: Color): Color {
	if (accent === COLORS.green) return COLORS.greenSoft;
	if (accent === COLORS.purple) return COLORS.purpleSoft;
	if (accent === COLORS.rose) return COLORS.roseSoft;
	if (accent === COLORS.amber) return COLORS.amberSoft;
	return COLORS.blueSoft;
}

function deriveChokePoint(data: AttackPathPdfReport): string {
	if (data.nodes.length < 2) return data.nodes[0]?.name || 'Path review required';
	const index = Math.max(0, Math.min(data.nodes.length - 2, Math.floor((data.nodes.length - 1) / 2)));
	return `${data.nodes[index].name} -> ${data.nodes[index + 1].name}`;
}

function safeChokePoint(data: AttackPathPdfReport): string {
	return normalizeArrowText(data.chokePoint || deriveChokePoint(data));
}

function shortMode(mode: AttackPathPdfReport['mode']): string {
	if (mode === 'Explore scenario') return 'EXPLORE';
	if (mode === 'Custom builder') return 'CUSTOM';
	return 'GUIDED';
}

function normalizeArrowText(value: string): string {
	return value
		.replace(/[→➜➝⟶⟹]/g, ' -> ')
		.replace(/\s*-\s*>\s*/g, ' -> ')
		.replace(/\s+/g, ' ')
		.trim();
}

function sanitizePdfText(value: unknown): string {
	return normalizeArrowText(String(value ?? ''))
		.replace(/\u0000/g, '')
		.replace(/\t/g, ' ')
		.replace(/\r\n?/g, '\n')
		.replace(/[’‘]/g, "'")
		.replace(/[“”]/g, '"')
		.replace(/…/g, '...')
		.trim();
}

function sanitizeFilename(value: string): string {
	const normalized = value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase();
	return normalized || 'attack-path';
}
