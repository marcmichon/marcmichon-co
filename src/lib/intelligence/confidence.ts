// src/lib/intelligence/confidence.ts

import type {
  ConfidenceLevel,
  ConfidenceResult,
  IntelligenceContext,
  VulnerabilitySignals,
} from "./types";

const MINIMUM_CONFIDENCE = 20;
const MAXIMUM_CONFIDENCE = 100;

/**
 * Confidence weights represent the contribution of each available
 * intelligence signal to the reliability of the final assessment.
 *
 * They do not represent vulnerability severity.
 */
const CONFIDENCE_WEIGHTS = {
  DESCRIPTION: 10,
  CVSS_SCORE: 15,
  CVSS_VECTOR: 10,
  EPSS: 15,
  KEV_STATUS: 20,
  WEAKNESS_CLASSIFICATION: 10,
  TIMELINE: 5,
  REFERENCES: 5,
  MULTIPLE_SOURCES: 10,
} as const;

/**
 * Builds an explainable confidence assessment.
 *
 * Confidence measures the completeness and corroboration of the
 * intelligence used by the engine. It must not be confused with
 * vulnerability severity or remediation urgency.
 */
export function buildConfidence<T>(
  context: IntelligenceContext<T>,
): ConfidenceResult {
  const signals = context.signals;

  const score = calculateConfidenceScore(signals);
  const level = resolveConfidenceLevel(score);

  return {
    score,
    level,
    summary: buildConfidenceSummary(signals, score),
  };
}

function calculateConfidenceScore(
  signals: VulnerabilitySignals,
): number {
  let score = MINIMUM_CONFIDENCE;

  if (signals.hasDescription) {
    score += CONFIDENCE_WEIGHTS.DESCRIPTION;
  }

  if (isValidCvssScore(signals.cvssScore)) {
    score += CONFIDENCE_WEIGHTS.CVSS_SCORE;
  }

  if (signals.hasCvssVector) {
    score += CONFIDENCE_WEIGHTS.CVSS_VECTOR;
  }

  if (isValidEpssProbability(signals.epssProbability)) {
    score += CONFIDENCE_WEIGHTS.EPSS;
  }

  /*
   * Both true and false KEV states are meaningful when the status
   * has actually been checked.
   *
   * undefined means that the information is unavailable.
   */
  if (typeof signals.isKnownExploited === "boolean") {
    score += CONFIDENCE_WEIGHTS.KEV_STATUS;
  }

  if (signals.hasWeaknessClassification) {
    score += CONFIDENCE_WEIGHTS.WEAKNESS_CLASSIFICATION;
  }

  if (signals.hasTimeline) {
    score += CONFIDENCE_WEIGHTS.TIMELINE;
  }

  if ((signals.referenceCount ?? 0) > 0) {
    score += CONFIDENCE_WEIGHTS.REFERENCES;
  }

  if ((signals.sourceCount ?? 0) >= 2) {
    score += CONFIDENCE_WEIGHTS.MULTIPLE_SOURCES;
  }

  return clamp(
    Math.round(score),
    MINIMUM_CONFIDENCE,
    MAXIMUM_CONFIDENCE,
  );
}

function resolveConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 90) {
    return "VERY_HIGH";
  }

  if (score >= 75) {
    return "HIGH";
  }

  if (score >= 55) {
    return "MEDIUM";
  }

  return "LOW";
}

function buildConfidenceSummary(
  signals: VulnerabilitySignals,
  score: number,
): string {
  const sourceCount = signals.sourceCount ?? 0;

  if (score >= 90 && signals.isKnownExploited === true) {
    return (
      "Évaluation étayée par plusieurs signaux de renseignement, " +
      "including confirmed active exploitation."
    );
  }

  if (score >= 90) {
    return (
      "Évaluation étayée par des renseignements complets et indépendamment " +
      "corroborated vulnerability intelligence."
    );
  }

  if (score >= 75 && sourceCount >= 2) {
    return (
      "Évaluation étayée par plusieurs sources de renseignement fiables " +
      "with only limited information gaps."
    );
  }

  if (score >= 75) {
    return (
      "Évaluation étayée par des preuves techniques solides, bien que " +
      "additional independent corroboration would improve confidence."
    );
  }

  if (score >= 55) {
    return (
      "Évaluation fondée sur des renseignements partiels. Validez les informations manquantes " +
      "technical or threat information before making a high-impact decision."
    );
  }

  return (
    "Le niveau de confiance est limité, car des renseignements importants " +
    "signals are unavailable or incomplete."
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

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(Math.max(value, minimum), maximum);
}