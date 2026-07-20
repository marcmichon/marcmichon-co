import type {
	VulnerabilityExplorerResult,
} from '../../types/vulnerability';

export type ExecutiveRiskLevel =
	| 'critical'
	| 'high'
	| 'medium'
	| 'low'
	| 'unknown';

export interface ExecutiveSignal {
	label: string;
	value: string;
	status:
		| 'critical'
		| 'warning'
		| 'positive'
		| 'neutral';
}

export interface ExecutiveSummary {
	title: string;
	riskLevel: ExecutiveRiskLevel;
	riskLabel: string;

	recommendation: string;
	explanation: string;

	confidence: number;
	confidenceLabel: string;

	signals: ExecutiveSignal[];
}

const normalizeEpss = (
	score: number | null | undefined,
): number | null => {
	if (
		score === null ||
		score === undefined ||
		Number.isNaN(score)
	) {
		return null;
	}

	/*
	 * FIRST renvoie généralement une valeur entre 0 et 1.
	 * On accepte également une éventuelle valeur déjà exprimée
	 * en pourcentage.
	 */
	return score > 1
		? Math.min(score / 100, 1)
		: Math.max(0, Math.min(score, 1));
};

const normalizeText = (
	value: string | null | undefined,
): string =>
	value
		?.trim()
		.toLowerCase() ?? '';

const isKnownRansomwareUse = (
	value: string | null | undefined,
): boolean => {
	const normalized =
		normalizeText(value);

	return [
		'known',
		'yes',
		'true',
		'known use',
	].includes(normalized);
};

const getCvssRisk = (
	score: number | null,
): ExecutiveRiskLevel => {
	if (score === null) {
		return 'unknown';
	}

	if (score >= 9) {
		return 'critical';
	}

	if (score >= 7) {
		return 'high';
	}

	if (score >= 4) {
		return 'medium';
	}

	return 'low';
};

const formatPercent = (
	score: number | null,
): string => {
	if (score === null) {
		return 'Unavailable';
	}

	return new Intl.NumberFormat(
		'en-US',
		{
			style: 'percent',
			maximumFractionDigits: 1,
		},
	).format(score);
};

const calculateConfidence = (
	result: VulnerabilityExplorerResult,
): number => {
	let confidence = 20;

	if (result.cvss?.score !== null) {
		confidence += 25;
	}

	if (result.cvss?.vector) {
		confidence += 10;
	}

	if (result.epss?.score !== null) {
		confidence += 20;
	}

	if (typeof result.kev?.listed === 'boolean') {
		confidence += 20;
	}

	if (result.references?.length > 0) {
		confidence += 5;
	}

	return Math.min(
		confidence,
		100,
	);
};

const getConfidenceLabel = (
	confidence: number,
): string => {
	if (confidence >= 90) {
		return 'Very high';
	}

	if (confidence >= 70) {
		return 'High';
	}

	if (confidence >= 50) {
		return 'Moderate';
	}

	return 'Limited';
};

export const buildExecutiveSummary = (
	result: VulnerabilityExplorerResult,
): ExecutiveSummary => {
	const cvss =
		result.cvss?.score ?? null;

	const epss =
		normalizeEpss(
			result.epss?.score,
		);

	const kev =
		result.kev?.listed === true;

	const ransomware =
		isKnownRansomwareUse(
			result.kev
				?.knownRansomwareCampaignUse,
		);

	const cvssRisk =
		getCvssRisk(cvss);

	let riskLevel: ExecutiveRiskLevel =
		cvssRisk;

	let title =
		'Vulnerability assessment';

	let recommendation =
		'Review the affected environment and apply the vendor guidance according to your remediation process.';

	let explanation =
		'The available vulnerability intelligence does not currently indicate an exceptional exploitation context.';

	/*
	 * Highest priority:
	 * known exploitation combined with strong technical severity.
	 */
	if (
		kev &&
		cvss !== null &&
		cvss >= 9
	) {
		riskLevel = 'critical';
		title = 'Critical exposure';

		recommendation =
			'Immediate remediation is strongly recommended. Identify exposed assets, apply the available mitigation or patch, and verify that exploitation has not already occurred.';

		explanation =
			'This vulnerability combines critical technical severity with confirmed exploitation in the wild through the CISA Known Exploited Vulnerabilities catalog.';
	} else if (kev) {
		riskLevel =
			cvss !== null && cvss >= 7
				? 'critical'
				: 'high';

		title =
			'Known exploited vulnerability';

		recommendation =
			'Prioritize remediation. Confirm affected assets, apply the vendor guidance, and investigate potentially exposed systems.';

		explanation =
			'The vulnerability is listed in the CISA Known Exploited Vulnerabilities catalog, which confirms active exploitation regardless of its technical score.';
	} else if (
		epss !== null &&
		epss >= 0.7
	) {
		riskLevel =
			cvss !== null && cvss >= 9
				? 'critical'
				: 'high';

		title =
			'High exploitation likelihood';

		recommendation =
			'Accelerate remediation and review internet-facing or business-critical assets as a priority.';

		explanation =
			'FIRST EPSS indicates a high probability of exploitation, increasing the operational priority beyond technical severity alone.';
	} else if (
		cvss !== null &&
		cvss >= 9
	) {
		riskLevel = 'high';
		title =
			'Critical technical severity';

		recommendation =
			'Prioritize remediation based on asset exposure, business impact, and the availability of compensating controls.';

		explanation =
			'The vulnerability has critical technical severity, but the available intelligence does not currently confirm active exploitation.';
	} else if (
		cvss !== null &&
		cvss >= 7
	) {
		riskLevel = 'high';
		title =
			'High-severity vulnerability';

		recommendation =
			'Plan remediation promptly and prioritize exposed or sensitive assets.';

		explanation =
			'The vulnerability presents significant technical impact, although active exploitation is not currently confirmed by the available sources.';
	} else if (
		cvss !== null &&
		cvss >= 4
	) {
		riskLevel = 'medium';
		title =
			'Moderate exposure';

		recommendation =
			'Assess affected assets and remediate through the standard vulnerability management cycle.';

		explanation =
			'The vulnerability presents moderate technical severity and no confirmed active exploitation signal.';
	} else if (cvss !== null) {
		riskLevel = 'low';
		title =
			'Limited exposure';

		recommendation =
			'Monitor the vulnerability and address it according to normal maintenance priorities.';

		explanation =
			'The available information indicates limited technical severity and no confirmed exploitation signal.';
	}

	if (ransomware) {
		riskLevel = 'critical';

		title =
			'Critical ransomware exposure';

		recommendation =
			'Treat this vulnerability as an emergency remediation case. Identify affected assets immediately, apply mitigations, and perform targeted threat hunting.';

		explanation =
			'The vulnerability is associated with known ransomware campaign activity, significantly increasing its operational risk.';
	}

	const confidence =
		calculateConfidence(result);

	return {
		title,
		riskLevel,
		riskLabel:
			riskLevel === 'unknown'
				? 'Unknown'
				: riskLevel
						.charAt(0)
						.toUpperCase() +
					riskLevel.slice(1),

		recommendation,
		explanation,

		confidence,
		confidenceLabel:
			getConfidenceLabel(
				confidence,
			),

		signals: [
			{
				label: 'CVSS',
				value:
					cvss !== null
						? `${cvss.toFixed(1)} ${result.cvss?.severity ?? ''}`.trim()
						: 'Unavailable',
				status:
					cvss !== null &&
					cvss >= 9
						? 'critical'
						: cvss !== null &&
							  cvss >= 7
							? 'warning'
							: 'neutral',
			},
			{
				label: 'EPSS',
				value:
					formatPercent(
						epss,
					),
				status:
					epss !== null &&
					epss >= 0.7
						? 'critical'
						: epss !== null &&
							  epss >= 0.3
							? 'warning'
							: 'neutral',
			},
			{
				label:
					'Known exploited',
				value: kev
					? 'Yes'
					: 'No',
				status: kev
					? 'critical'
					: 'positive',
			},
			{
				label:
					'Ransomware use',
				value: ransomware
					? 'Known'
					: 'Not known',
				status: ransomware
					? 'critical'
					: 'neutral',
			},
		],
	};
};