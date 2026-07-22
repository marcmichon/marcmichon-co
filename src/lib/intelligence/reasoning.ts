import type {
  IntelligenceContext,
  ReasoningItem,
  VulnerabilitySignals,
} from "./types";

/**
 * Operational contribution of each signal.
 *
 * These weights represent remediation urgency.
 * They do not represent intelligence confidence.
 */
const DECISION_WEIGHTS = {
  KNOWN_EXPLOITED: 50,

  CRITICAL_CVSS: 25,
  HIGH_CVSS: 18,
  MEDIUM_CVSS: 8,

  VERY_HIGH_EPSS: 27,
  HIGH_EPSS: 18,
  MODERATE_EPSS: 10,
  LOW_EPSS: 3,

  UNKNOWN_CVSS: 5,
  UNKNOWN_EPSS: 3,
} as const;

/**
 * Builds the explainable factors used by the decision engine.
 */
export function buildReasoning<T>(
  context: IntelligenceContext<T>,
): ReasoningItem[] {
  const { signals } = context;

  return [
    buildKnownExploitationReasoning(signals),
    buildCvssReasoning(signals),
    buildEpssReasoning(signals),
  ];
}

/**
 * Calculates the final score directly from the exposed reasoning items.
 *
 * This guarantees that:
 *
 * displayed contributions === calculated score.
 */
export function calculateReasoningScore(
  reasoning: ReasoningItem[],
): number {
  const total = reasoning.reduce(
    (score, item) => score + item.scoreContribution,
    0,
  );

  return clamp(Math.round(total), 0, 100);
}

function buildKnownExploitationReasoning(
  signals: VulnerabilitySignals,
): ReasoningItem {
  if (signals.isKnownExploited === true) {
    return {
      id: "known-exploited",
      title: "Vulnérabilité activement exploitée",
      description:
        "Une exploitation active a été confirmée. Ce signal est considéré comme déterminant dans l’évaluation du risque opérationnel.",
      scoreContribution:
        DECISION_WEIGHTS.KNOWN_EXPLOITED,
      source: "CISA KEV",
      confidence: 100,
    };
  }

  if (signals.isKnownExploited === false) {
    return {
  id: "not-listed-in-kev",
  title: "Non référencée dans CISA KEV",
  description:
    "La vulnérabilité n’est actuellement pas référencée dans le catalogue CISA KEV. Cela n’exclut pas une exploitation observée par d’autres sources.",
  scoreContribution: 0,
  source: "CISA KEV",
  confidence: 100,
};
  }

  return {
    id: "unknown-exploitation-status",
    title: "Statut d’exploitation indisponible",
    description:
      "Le statut d’exploitation connue n’a pas pu être établi à partir des renseignements disponibles.",
    scoreContribution: 0,
    source: "CISA KEV",
    confidence: 30,
  };
}

function buildCvssReasoning(
  signals: VulnerabilitySignals,
): ReasoningItem {
  const { cvssScore } = signals;

  if (!isValidCvssScore(cvssScore)) {
    return {
      id: "cvss-unavailable",
      title: "CVSS indisponible",
      description:
        "La sévérité technique n’a pas pu être établie complètement, car aucun score CVSS valide n’est disponible.",
      scoreContribution:
        DECISION_WEIGHTS.UNKNOWN_CVSS,
      source: "NVD",
      confidence: 25,
    };
  }

  const confidence = signals.hasCvssVector ? 100 : 85;

  if (cvssScore >= 9) {
    return {
      id: "critical-cvss",
      title: "Sévérité technique critique",
      description:
        `The CVSS base score is ${cvssScore.toFixed(1)}, placing the vulnerability in the critical severity range.`,
      scoreContribution:
        DECISION_WEIGHTS.CRITICAL_CVSS,
      source: "NVD",
      confidence,
    };
  }

  if (cvssScore >= 7) {
    return {
      id: "high-cvss",
      title: "Sévérité technique élevée",
      description:
        `The CVSS base score is ${cvssScore.toFixed(1)}, indicating a high potential technical impact.`,
      scoreContribution:
        DECISION_WEIGHTS.HIGH_CVSS,
      source: "NVD",
      confidence,
    };
  }

  if (cvssScore >= 4) {
    return {
      id: "medium-cvss",
      title: "Sévérité technique modérée",
      description:
        `The CVSS base score is ${cvssScore.toFixed(1)}, placing the vulnerability in the medium severity range.`,
      scoreContribution:
        DECISION_WEIGHTS.MEDIUM_CVSS,
      source: "NVD",
      confidence,
    };
  }

  return {
    id: "low-cvss",
    title: "Sévérité technique faible",
    description:
      `The CVSS base score is ${cvssScore.toFixed(1)}, indicating limited technical severity.`,
    scoreContribution: 0,
    source: "NVD",
    confidence,
  };
}

function buildEpssReasoning(
  signals: VulnerabilitySignals,
): ReasoningItem {
  const { epssProbability } = signals;

  if (!isValidEpssProbability(epssProbability)) {
    return {
      id: "epss-unavailable",
      title: "Probabilité d’exploitation indisponible",
      description:
        "La probabilité d’exploitation n’a pas pu être évaluée, car les données EPSS sont indisponibles.",
      scoreContribution:
        DECISION_WEIGHTS.UNKNOWN_EPSS,
      source: "FIRST EPSS",
      confidence: 25,
    };
  }

  const percentage = formatPercentage(epssProbability);

  if (epssProbability >= 0.7) {
    return {
      id: "very-high-epss",
      title: "Probabilité d’exploitation très élevée",
      description:
        `EPSS estimates a ${percentage} probability of exploitation within its prediction window.`,
      scoreContribution:
        DECISION_WEIGHTS.VERY_HIGH_EPSS,
      source: "FIRST EPSS",
      confidence: 90,
    };
  }

  if (epssProbability >= 0.3) {
    return {
      id: "high-epss",
      title: "Probabilité d’exploitation élevée",
      description:
        `EPSS estimates a ${percentage} probability of exploitation, materially increasing remediation priority.`,
      scoreContribution:
        DECISION_WEIGHTS.HIGH_EPSS,
      source: "FIRST EPSS",
      confidence: 90,
    };
  }

  if (epssProbability >= 0.1) {
    return {
      id: "moderate-epss",
      title: "Probabilité d’exploitation modérée",
      description:
        `EPSS estimates a ${percentage} probability of exploitation, indicating a meaningful threat signal.`,
      scoreContribution:
        DECISION_WEIGHTS.MODERATE_EPSS,
      source: "FIRST EPSS",
      confidence: 90,
    };
  }

  if (epssProbability > 0) {
    return {
      id: "low-epss",
      title: "Probabilité d’exploitation faible",
      description:
        `EPSS currently estimates a ${percentage} probability of exploitation. This may change as threat activity evolves.`,
      scoreContribution:
        DECISION_WEIGHTS.LOW_EPSS,
      source: "FIRST EPSS",
      confidence: 90,
    };
  }

  return {
    id: "minimal-epss",
    title: "Probabilité d’exploitation minimale",
    description:
      "EPSS ne signale actuellement aucune probabilité d’exploitation mesurable. Le maintien d’une surveillance reste approprié.",
    scoreContribution: 0,
    source: "FIRST EPSS",
    confidence: 90,
  };
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
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
  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}