import type { RiskInput, RiskResult } from './riskEngine';
import {
	getAssetLabel,
	getCriticalityLabel,
	getExposureLabel,
	yesNo,
} from './riskLabels';

function formatBulletList(
	items: string[],
	emptyMessage: string
): string {
	if (items.length === 0) {
		return `- ${emptyMessage}`;
	}

	return items.map((item) => `- ${item}`).join('\n');
}

function formatNumberedList(
	items: string[],
	emptyMessage: string
): string {
	if (items.length === 0) {
		return `1. ${emptyMessage}`;
	}

	return items
		.map((item, index) => `${index + 1}. ${item}`)
		.join('\n');
}

export function buildCompleteRiskReport(
	input: RiskInput,
	result: RiskResult
): string {
	const riskFactors = formatBulletList(
		result.riskFactors,
		'Aucun facteur aggravant majeur identifié.'
	);

	const protectiveFactors = formatBulletList(
		result.protectiveFactors,
		'Aucun contrôle compensatoire déclaré.'
	);

	const recommendations = formatNumberedList(
		result.recommendations,
		'Documenter le scénario et organiser une revue du risque.'
	);

	const reductionLabel =
		result.controlReduction > 1 ? 'points' : 'point';

	return `MM Risk Score
===============

SCÉNARIO
--------
${input.scenario}

CONTEXTE
--------
Type d’actif : ${getAssetLabel(input.assetType)}
Exposition : ${getExposureLabel(input.exposure)}
Criticité métier : ${getCriticalityLabel(input.criticality)}

EXPLOITABILITÉ
--------------
CVSS : ${input.cvss.toFixed(1)}/10
EPSS : ${input.epss.toFixed(1)} %
Exploit public disponible : ${yesNo(input.publicExploit)}
Authentification nécessaire : ${yesNo(input.authenticationRequired)}

IMPACT POTENTIEL
----------------
Données sensibles : ${yesNo(input.sensitiveData)}
Interruption métier importante : ${yesNo(input.businessInterruption)}
Privilèges élevés : ${yesNo(input.privilegedAccess)}
Mouvement latéral possible : ${yesNo(input.lateralMovement)}

CONTRÔLES COMPENSATOIRES
------------------------
EDR : ${yesNo(input.controls.edr)}
WAF : ${yesNo(input.controls.waf)}
MFA : ${yesNo(input.controls.mfa)}
Segmentation : ${yesNo(input.controls.segmentation)}
Sauvegardes : ${yesNo(input.controls.backups)}
Supervision SOC : ${yesNo(input.controls.soc)}

RÉSULTAT
--------
MM Risk Score : ${result.score}/100
Niveau : ${result.level}
Priorité : ${result.priority}
Délai conseillé : ${result.deadline}

Probabilité calculée : ${result.probability}/5
Impact calculé : ${result.impact}/5
Réduction apportée par les contrôles : -${result.controlReduction} ${reductionLabel}

ANALYSE AUTOMATIQUE
-------------------
${result.summary}

FACTEURS AUGMENTANT LE RISQUE
-----------------------------
${riskFactors}

CONTRÔLES PROTECTEURS
---------------------
${protectiveFactors}

PRIORITÉS RECOMMANDÉES
----------------------
${recommendations}

AVERTISSEMENT
-------------
Le MM Risk Score est une méthode d’aide à la décision. Il fournit une estimation contextualisée à partir des informations renseignées, mais ne remplace pas une analyse de risque complète et ne constitue pas un standard officiel.`;
}