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
 * Builds the high-level remediation decision.
 *
 * The score comes exclusively from reasoning.ts so the displayed
 * explanation and the final decision always share the same source
 * of truth.
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
 * Resolves the final decision.
 *
 * Confirmed exploitation is treated as a dominant signal.
 * A known-exploited vulnerability must not be downgraded solely
 * because EPSS remains low.
 */
function resolveExecutiveDecision(
  signals: VulnerabilitySignals,
  score: number,
): ExecutiveDecision {
  if (
    signals.isKnownExploited === true &&
    (
      !isValidCvssScore(signals.cvssScore) ||
      signals.cvssScore >= 7
    )
  ) {
    return "REMEDIATE_IMMEDIATELY";
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
      "Une exploitation confirmée crée une urgence opérationnelle immédiate. " +
      "Validez l’exposition et engagez la remédiation sans attendre " +
      "exploit probability alone to increase."
    );
  }

  if (
    decision === "REMEDIATE_IMMEDIATELY" &&
    isCriticalCvss(signals.cvssScore) &&
    isVeryHighEpss(signals.epssProbability)
  ) {
    return (
      "Sévérité technique critique combined with a very high probability " +
      "of exploitation requires immediate remediation."
    );
  }

  if (decision === "REMEDIATE_IMMEDIATELY") {
    return (
      "Les signaux combinés de la vulnérabilité indiquent une priorité critique " +
      "operational priority requiring immediate action."
    );
  }

  if (
    decision === "PRIORITIZE" &&
    isHighEpss(signals.epssProbability)
  ) {
    return (
      "La probabilité d’exploitation augmente significativement la priorité " +
      "operational priority. Remediation should be accelerated."
    );
  }

  if (decision === "PRIORITIZE") {
    return (
      "Les signaux techniques et de menace disponibles justifient de placer " +
      "this vulnerability in the next priority remediation cycle."
    );
  }

  if (decision === "PLAN_PATCHING") {
    return (
      "La vulnérabilité doit être traitée dans le cadre du processus normal " +
      "patching process while exposure and threat signals are monitored."
    );
  }

  return (
    "Les renseignements actuels n’indiquent pas qu’une remédiation immédiate " +
    "urgency. Continue monitoring for changes in exploitation activity."
  );
}

function isCriticalCvss(
  value: number | undefined,
): boolean {
  return isValidCvssScore(value) && value >= 9;
}

function isHighEpss(
  value: number | undefined,
): boolean {
  return (
    isValidEpssProbability(value) &&
    value >= 0.3
  );
}

function isVeryHighEpss(
  value: number | undefined,
): boolean {
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