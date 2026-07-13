export interface RiskInput {
	scenario: string;
	assetType: string;
	exposure: string;
	criticality: number;
	cvss: number;
	epss: number;
	publicExploit: boolean;
	authenticationRequired: boolean;
	sensitiveData: boolean;
	businessInterruption: boolean;
	privilegedAccess: boolean;
	lateralMovement: boolean;
	controls: {
		edr: boolean;
		waf: boolean;
		mfa: boolean;
		segmentation: boolean;
		backups: boolean;
		soc: boolean;
	};
}

export interface RiskResult {
	score: number;
	level: 'Faible' | 'Modéré' | 'Élevé' | 'Critique';
	priority: 'P3' | 'P2' | 'P1' | 'P0';
	deadline: string;
	probability: number;
	impact: number;
	controlReduction: number;
	summary: string;
	riskFactors: string[];
	protectiveFactors: string[];
	recommendations: string[];
}

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

function calculateProbability(input: RiskInput): number {
	const exposureScores: Record<string, number> = {
		internet: 5,
		partner: 4,
		vpn: 3,
		internal: 2,
		isolated: 1,
	};

	const exposureScore = exposureScores[input.exposure] ?? 2;
	const cvssScore = clamp(input.cvss / 2, 0, 5);
	const epssScore = clamp(input.epss / 20, 0, 5);

	let probability =
		exposureScore * 0.35 +
		cvssScore * 0.3 +
		epssScore * 0.25;

	if (input.publicExploit) {
		probability += 0.75;
	}

	if (!input.authenticationRequired) {
		probability += 0.35;
	}

	return clamp(Math.round(probability), 1, 5);
}

function calculateImpact(input: RiskInput): number {
	const criticalityScores: Record<number, number> = {
		1: 1.5,
		2: 2.5,
		3: 4,
		4: 5,
	};

	const assetModifiers: Record<string, number> = {
		workstation: 0.2,
		server: 0.5,
		'web-application': 0.6,
		api: 0.7,
		database: 0.9,
		'active-directory': 1.2,
		cloud: 0.7,
		ot: 1.1,
	};

	let impact = criticalityScores[input.criticality] ?? 2;
	impact += assetModifiers[input.assetType] ?? 0;

	if (input.sensitiveData) impact += 0.7;
	if (input.businessInterruption) impact += 0.8;
	if (input.privilegedAccess) impact += 0.7;
	if (input.lateralMovement) impact += 0.7;

	return clamp(Math.round(impact), 1, 5);
}

function calculateControlReduction(input: RiskInput): number {
	let reduction = 0;

	if (input.controls.edr) reduction += 3;
	if (input.controls.waf) reduction += 4;
	if (input.controls.mfa) reduction += 4;
	if (input.controls.segmentation) reduction += 4;
	if (input.controls.backups) reduction += 2;
	if (input.controls.soc) reduction += 2;

	return reduction;
}

function getClassification(score: number): {
	level: RiskResult['level'];
	priority: RiskResult['priority'];
	deadline: string;
} {
	if (score >= 85) {
		return {
			level: 'Critique',
			priority: ' P0',
			deadline: ' 24 heures',
		};
	}

	if (score >= 70) {
		return {
			level: 'Élevé',
			priority: ' P1',
			deadline: ' 72 heures',
		};
	}

	if (score >= 45) {
		return {
			level: 'Modéré',
			priority: ' P2',
			deadline: ' 30 jours',
		};
	}

	return {
		level: 'Faible',
		priority: ' P3',
		deadline: ' Traitement planifié',
	};
}

function buildRiskFactors(input: RiskInput): string[] {
	const factors: string[] = [];

	if (input.exposure === 'internet') {
		factors.push('Actif exposé directement sur Internet');
	}

	if (input.cvss >= 9) {
		factors.push(`Sévérité technique critique — CVSS ${input.cvss.toFixed(1)}`);
	} else if (input.cvss >= 7) {
		factors.push(`Sévérité technique élevée — CVSS ${input.cvss.toFixed(1)}`);
	}

	if (input.epss >= 70) {
		factors.push(`Probabilité d’exploitation élevée — EPSS ${input.epss}%`);
	}

	if (input.publicExploit) {
		factors.push('Exploit public disponible');
	}

	if (!input.authenticationRequired) {
		factors.push('Exploitation possible sans authentification');
	}

	if (input.sensitiveData) {
		factors.push('Présence de données sensibles');
	}

	if (input.businessInterruption) {
		factors.push('Interruption métier importante possible');
	}

	if (input.privilegedAccess) {
		factors.push('Accès privilégiés potentiellement concernés');
	}

	if (input.lateralMovement) {
		factors.push('Mouvement latéral possible');
	}

	return factors;
}

function buildProtectiveFactors(input: RiskInput): string[] {
	const factors: string[] = [];

	if (input.controls.edr) factors.push('Protection EDR');
	if (input.controls.waf) factors.push('Web Application Firewall');
	if (input.controls.mfa) factors.push('Authentification multifacteur');
	if (input.controls.segmentation) factors.push('Segmentation réseau');
	if (input.controls.backups) factors.push('Sauvegardes disponibles');
	if (input.controls.soc) factors.push('Supervision SOC');

	return factors;
}

function buildRecommendations(input: RiskInput): string[] {
	const recommendations: string[] = [];

	if (input.cvss >= 7 || input.epss >= 50 || input.publicExploit) {
		recommendations.push(
			'Prioriser la correction ou la mise en place d’une mesure compensatoire.'
		);
	}

	if (input.exposure === 'internet') {
		recommendations.push(
			'Vérifier si l’exposition Internet est indispensable et la réduire lorsque cela est possible.'
		);
	}

	if (!input.authenticationRequired) {
		recommendations.push(
			'Évaluer la possibilité d’imposer une authentification ou un contrôle d’accès supplémentaire.'
		);
	}

	if (input.privilegedAccess) {
		recommendations.push(
			'Contrôler les comptes privilégiés et limiter les droits associés à l’actif.'
		);
	}

	if (input.lateralMovement && !input.controls.segmentation) {
		recommendations.push(
			'Renforcer la segmentation afin de limiter les possibilités de mouvement latéral.'
		);
	}

	if (
		input.assetType === 'web-application' &&
		input.exposure === 'internet' &&
		!input.controls.waf
	) {
		recommendations.push(
			'Évaluer la mise en place ou le renforcement d’un WAF.'
		);
	}

	if (!input.controls.edr) {
		recommendations.push(
			'Vérifier la possibilité de déployer une protection endpoint adaptée.'
		);
	}

	if (!input.controls.soc) {
		recommendations.push(
			'Mettre en place une supervision des événements et des comportements associés.'
		);
	}

	if (input.businessInterruption && !input.controls.backups) {
		recommendations.push(
			'Vérifier les mécanismes de sauvegarde, de restauration et de continuité.'
		);
	}

	return recommendations.slice(0, 5);
}

export function calculateRisk(input: RiskInput): RiskResult {
	const probability = calculateProbability(input);
	const impact = calculateImpact(input);
	const controlReduction = calculateControlReduction(input);

	const inherentScore = Math.round(
		((probability * impact) / 25) * 100
	);

	const score = clamp(inherentScore - controlReduction, 0, 100);
	const classification = getClassification(score);

	const riskFactors = buildRiskFactors(input);
	const protectiveFactors = buildProtectiveFactors(input);
	const recommendations = buildRecommendations(input);

	const summary =
		`Le scénario présente un niveau de risque ${classification.level.toLowerCase()}. ` +
		`La probabilité calculée est de ${probability}/5 et l’impact potentiel de ${impact}/5. ` +
		`Les contrôles compensatoires identifiés réduisent le score de ${controlReduction} point${controlReduction > 1 ? 's' : ''}.`;

	return {
		score,
		level: classification.level,
		priority: classification.priority,
		deadline: classification.deadline,
		probability,
		impact,
		controlReduction,
		summary,
		riskFactors,
		protectiveFactors,
		recommendations,
	};
}