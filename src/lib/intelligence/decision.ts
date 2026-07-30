import {
  buildReasoning,
  calculateReasoningScore,
} from "./reasoning";

import type {
  DecisionResult,
  ExecutiveDecision,
  ImpactLevel,
  IntelligenceContext,
  VulnerabilitySignals,
} from "./types";

/**
 * Construit la décision de remédiation de haut niveau.
 *
 * Le score provient exclusivement de reasoning.ts afin que les facteurs
 * affichés et la décision finale restent cohérents. Des garde-fous métier
 * empêchent toutefois qu'un signal dominant (KEV, CVSS critique ou EPSS
 * très élevé) soit dilué par le score agrégé.
 */
export function buildDecision<T>(
  context: IntelligenceContext<T>,
): DecisionResult {
  const reasoning = buildReasoning(context);
  const score = calculateReasoningScore(reasoning);

  const decision = resolveExecutiveDecision(
    context.signals,
    score,
  );

  return {
    decision,
    score,
    urgency: resolveUrgency(decision),
    title: resolveDecisionTitle(decision),
    summary: buildDecisionSummary(
      decision,
      context.signals,
    ),
  };
}

/**
 * Résout la décision opérationnelle finale.
 *
 * Ordre de priorité :
 * 1. Exploitation connue (CISA KEV).
 * 2. Sévérité critique associée à une probabilité d'exploitation élevée.
 * 3. Sévérité critique seule : qualification immédiate et remédiation prioritaire.
 * 4. EPSS très élevé ou combinaison CVSS élevé + EPSS significatif.
 * 5. Score agrégé du moteur.
 */
function resolveExecutiveDecision(
  signals: VulnerabilitySignals,
  score: number,
): ExecutiveDecision {
  const cvss = signals.cvssScore;
  const epss = signals.epssProbability;

  // Une inscription KEV confirme une exploitation dans la nature :
  // elle ne doit jamais être minorée par un EPSS faible ou un CVSS incomplet.
  if (signals.isKnownExploited === true) {
    return "REMEDIATE_IMMEDIATELY";
  }

  // Une vulnérabilité critique assortie d'un signal d'exploitation élevé
  // constitue une urgence opérationnelle.
  if (
    isCriticalCvss(cvss) &&
    isHighEpss(epss)
  ) {
    return "REMEDIATE_IMMEDIATELY";
  }

  // Un CVSS critique ne doit jamais retomber dans un cycle de remédiation normal.
  // L'exposition réelle reste à qualifier, mais le traitement doit être prioritaire.
  if (isCriticalCvss(cvss)) {
    return "PRIORITIZE";
  }

  // Un EPSS très élevé justifie une priorisation même lorsque le CVSS est inférieur à 9.
  if (isVeryHighEpss(epss)) {
    return "PRIORITIZE";
  }

  // La combinaison d'une sévérité élevée et d'un signal EPSS significatif
  // doit également sortir du cycle standard.
  if (
    isHighCvss(cvss) &&
    isModerateEpss(epss)
  ) {
    return "PRIORITIZE";
  }

  if (score >= 70) {
    return "REMEDIATE_IMMEDIATELY";
  }

  if (score >= 45) {
    return "PRIORITIZE";
  }

  if (score >= 20) {
    return "PLAN_PATCHING";
  }

  return "MONITOR";
}

function resolveUrgency(
  decision: ExecutiveDecision,
): ImpactLevel {
  switch (decision) {
    case "REMEDIATE_IMMEDIATELY":
      return "CRITICAL";

    case "PRIORITIZE":
      return "HIGH";

    case "PLAN_PATCHING":
      return "MEDIUM";

    case "MONITOR":
      return "LOW";
  }
}

function resolveDecisionTitle(
  decision: ExecutiveDecision,
): string {
  switch (decision) {
    case "REMEDIATE_IMMEDIATELY":
      return "Remédier immédiatement";

    case "PRIORITIZE":
      return "Prioriser la remédiation";

    case "PLAN_PATCHING":
      return "Planifier la remédiation";

    case "MONITOR":
      return "Surveiller";
  }
}

function buildDecisionSummary(
  decision: ExecutiveDecision,
  signals: VulnerabilitySignals,
): string {
  if (
    decision === "REMEDIATE_IMMEDIATELY" &&
    signals.isKnownExploited === true
  ) {
    return (
      "Cette vulnérabilité est associée à une exploitation confirmée dans la nature. " +
      "Identifiez sans délai les actifs concernés, qualifiez leur exposition et engagez " +
      "la remédiation ou les mesures compensatoires disponibles."
    );
  }

  if (
    decision === "REMEDIATE_IMMEDIATELY" &&
    isCriticalCvss(signals.cvssScore) &&
    isHighEpss(signals.epssProbability)
  ) {
    return (
      "La combinaison d'une sévérité technique critique et d'une probabilité " +
      "d'exploitation élevée impose une qualification immédiate des actifs concernés " +
      "et un traitement en urgence."
    );
  }

  if (decision === "REMEDIATE_IMMEDIATELY") {
    return (
      "Les signaux techniques et de menace disponibles indiquent une priorité " +
      "opérationnelle critique. Validez immédiatement l'exposition et engagez les " +
      "actions de remédiation adaptées."
    );
  }

  if (
    decision === "PRIORITIZE" &&
    isCriticalCvss(signals.cvssScore)
  ) {
    return (
      `Le score CVSS de ${signals.cvssScore!.toFixed(1)} place cette vulnérabilité dans ` +
      "la catégorie critique. Les actifs concernés doivent être identifiés et leur " +
      "exposition qualifiée immédiatement, puis la remédiation doit être intégrée au " +
      "prochain créneau prioritaire."
    );
  }

  if (
    decision === "PRIORITIZE" &&
    isHighEpss(signals.epssProbability)
  ) {
    return (
      "La probabilité d'exploitation augmente significativement la priorité " +
      "opérationnelle. Accélérez la qualification du périmètre affecté et la mise en " +
      "œuvre du correctif ou des mesures compensatoires."
    );
  }

  if (decision === "PRIORITIZE") {
    return (
      "Les signaux techniques et de menace disponibles justifient une remédiation " +
      "prioritaire. Confirmez les actifs affectés, leur exposition et les contraintes " +
      "de déploiement avant intervention."
    );
  }

  if (decision === "PLAN_PATCHING") {
    return (
      "La vulnérabilité doit être intégrée au processus normal de remédiation. " +
      "Maintenez une surveillance de l'exposition, de l'EPSS et d'une éventuelle " +
      "apparition dans le catalogue CISA KEV."
    );
  }

  return (
    "Les renseignements actuellement disponibles ne justifient pas une remédiation " +
    "urgente. Conservez la vulnérabilité sous surveillance et réévaluez la décision " +
    "si les signaux d'exploitation ou le contexte d'exposition évoluent."
  );
}

function isCriticalCvss(
  value: number | undefined,
): value is number {
  return isValidCvssScore(value) && value >= 9;
}

function isHighCvss(
  value: number | undefined,
): value is number {
  return isValidCvssScore(value) && value >= 7;
}

function isModerateEpss(
  value: number | undefined,
): value is number {
  return (
    isValidEpssProbability(value) &&
    value >= 0.1
  );
}

function isHighEpss(
  value: number | undefined,
): value is number {
  return (
    isValidEpssProbability(value) &&
    value >= 0.3
  );
}

function isVeryHighEpss(
  value: number | undefined,
): value is number {
  return (
    isValidEpssProbability(value) &&
    value >= 0.7
  );
}

function isValidCvssScore(
  value: number | undefined,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 10
  );
}

function isValidEpssProbability(
  value: number | undefined,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}
