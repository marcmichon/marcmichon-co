import type { VulnerabilityExplorerResult } from '../../types/vulnerability';

export type IntelligenceLevel = 'critical' | 'high' | 'medium' | 'low' | 'unknown';
export type IntelligenceDecision = 'Remediate now' | 'Prioritize' | 'Monitor' | 'Review';

export interface IntelligenceReason {
	label: string;
	value: string;
	status: IntelligenceLevel | 'positive';
	detail: string;
}

export interface IntelligenceAction {
	horizon: 'Immediate' | 'Within 24–72 hours' | 'Validation';
	title: string;
	description: string;
}

export interface MMIntelligence {
	score: number;
	level: IntelligenceLevel;
	decision: IntelligenceDecision;
	sla: string;
	confidence: number;
	confidenceLabel: string;
	assessment: string;
	analystComment: string;
	businessImpact: string;
	reasons: IntelligenceReason[];
	actions: IntelligenceAction[];
}

const normalizeProbability = (value: number | null | undefined): number | null => {
	if (value === null || value === undefined || Number.isNaN(value)) return null;
	return value > 1 ? Math.min(value / 100, 1) : Math.max(0, Math.min(value, 1));
};

const levelFromScore = (score: number): IntelligenceLevel => {
	if (score >= 85) return 'critical';
	if (score >= 65) return 'high';
	if (score >= 40) return 'medium';
	return 'low';
};

export const buildMMIntelligence = (result: VulnerabilityExplorerResult): MMIntelligence => {
	const cvss = result.cvss?.score ?? null;
	const epss = normalizeProbability(result.epss?.score);
	const percentile = normalizeProbability(result.epss?.percentile);
	const kev = result.kev?.listed === true;
	const ransomware = (result.kev?.knownRansomwareCampaignUse ?? '').toLowerCase() === 'known';
	const hasDescription = Boolean(result.description);
	const hasVector = Boolean(result.cvss?.vector);
	const sourceCount = [result.sources?.nvd, result.sources?.epss, result.sources?.kev].filter(Boolean).length;

	let score = 0;
	if (cvss !== null) score += cvss * 4;
	if (epss !== null) score += epss * 30;
	if (kev) score += 24;
	if (ransomware) score += 6;
	if (percentile !== null && percentile >= .9) score += 4;
	score = Math.round(Math.max(0, Math.min(score, 100)));

	const level = levelFromScore(score);
	const decision: IntelligenceDecision =
		level === 'critical' ? 'Remediate now' :
		level === 'high' ? 'Prioritize' :
		level === 'medium' ? 'Monitor' : 'Review';
	const sla = level === 'critical' ? '24 hours' : level === 'high' ? '72 hours' : level === 'medium' ? '7 days' : 'Risk-based';

	let confidence = 45;
	if (cvss !== null) confidence += 15;
	if (epss !== null) confidence += 15;
	if (sourceCount >= 2) confidence += 10;
	if (hasDescription) confidence += 7;
	if (hasVector) confidence += 5;
	if (kev) confidence += 3;
	confidence = Math.min(confidence, 98);
	const confidenceLabel = confidence >= 85 ? 'High confidence' : confidence >= 65 ? 'Moderate confidence' : 'Limited confidence';

	const exploitationText = kev
		? 'confirmed exploitation in the wild'
		: epss !== null && epss >= .7
			? 'a very high statistical probability of exploitation'
			: epss !== null && epss >= .3
				? 'an elevated probability of exploitation'
				: 'no confirmed exploitation signal from the sources currently available';

	const severityText = cvss !== null
		? `a CVSS score of ${cvss.toFixed(1)}`
		: 'no complete CVSS score';

	const assessment = `This vulnerability combines ${severityText} with ${exploitationText}. The resulting MM Intelligence score is ${score}/100 and supports a ${decision.toLowerCase()} decision.`;
	const analystComment = kev
		? 'The CISA KEV signal materially changes the priority: this is no longer a theoretical exposure and should be handled as an active operational risk.'
		: epss !== null && epss >= .3
			? 'The absence of a KEV listing should not be treated as evidence of safety. The EPSS signal indicates that exploitation remains plausible and prioritization should reflect asset exposure.'
			: 'Current public signals do not justify emergency handling by themselves. Asset criticality, internet exposure and compensating controls should drive the final decision.';
	const businessImpact = level === 'critical'
		? 'Potential compromise of exposed systems, interruption of critical services, data loss or use as an initial-access vector.'
		: level === 'high'
			? 'Material risk to vulnerable systems, especially when internet-facing or supporting sensitive business processes.'
			: 'Impact depends primarily on asset exposure, business criticality and the presence of effective compensating controls.';

	const reasons: IntelligenceReason[] = [
		{
			label: 'Technical severity',
			value: cvss === null ? 'Unavailable' : `${cvss.toFixed(1)} / 10`,
			status: cvss === null ? 'unknown' : cvss >= 9 ? 'critical' : cvss >= 7 ? 'high' : cvss >= 4 ? 'medium' : 'low',
			detail: cvss === null ? 'No complete CVSS score was returned.' : 'Measures intrinsic technical severity, not business exposure.',
		},
		{
			label: 'Exploit probability',
			value: epss === null ? 'Unavailable' : `${(epss * 100).toFixed(2)}%`,
			status: epss === null ? 'unknown' : epss >= .7 ? 'critical' : epss >= .3 ? 'high' : epss >= .1 ? 'medium' : 'low',
			detail: 'FIRST EPSS estimates the probability of exploitation in the next 30 days.',
		},
		{
			label: 'Known exploitation',
			value: kev ? 'Confirmed' : 'Not listed',
			status: kev ? 'critical' : 'positive',
			detail: kev ? 'CISA confirms exploitation in real-world attacks.' : 'No current CISA KEV listing was returned.',
		},
		{
			label: 'Ransomware use',
			value: ransomware ? 'Known' : result.kev?.knownRansomwareCampaignUse || 'Unknown',
			status: ransomware ? 'critical' : 'unknown',
			detail: ransomware ? 'Observed in known ransomware campaigns.' : 'No confirmed ransomware campaign signal is available.',
		},
	];

	const actions: IntelligenceAction[] = [
		{
			horizon: 'Immediate',
			title: level === 'critical' ? 'Reduce exposure and begin remediation' : 'Validate affected assets',
			description: level === 'critical'
				? 'Patch or apply vendor mitigations, restrict external exposure and identify vulnerable internet-facing systems.'
				: 'Confirm product versions, asset ownership, internet exposure and business criticality before assigning the final remediation priority.',
		},
		{
			horizon: 'Within 24–72 hours',
			title: 'Hunt and coordinate',
			description: kev
				? 'Review EDR, firewall, proxy and authentication telemetry for exploitation attempts or post-exploitation activity.'
				: 'Prepare the remediation plan, communicate ownership and review detections for relevant exploitation behavior.',
		},
		{
			horizon: 'Validation',
			title: 'Prove risk reduction',
			description: 'Run a verification scan, document exceptions, confirm mitigation coverage and retain evidence of remediation.',
		},
	];

	return { score, level, decision, sla, confidence, confidenceLabel, assessment, analystComment, businessImpact, reasons, actions };
};
