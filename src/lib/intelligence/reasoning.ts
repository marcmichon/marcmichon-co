import type {
  IntelligenceContext,
  ReasoningItem,
  VulnerabilitySignals,
} from "./types";

/**
 * Contribution opérationnelle de chaque signal.
 *
 * Le score mesure la priorité de remédiation, pas le niveau de confiance.
 * Les seuils sont alignés avec decision.ts :
 *
 * - 70 à 100 : remédiation immédiate ;
 * - 45 à 69  : remédiation prioritaire ;
 * - 20 à 44  : remédiation planifiée ;
 * - 0 à 19   : surveillance.
 */
const DECISION_WEIGHTS = {
  KNOWN_EXPLOITED: 50,

  CRITICAL_CVSS: 45,
  HIGH_CVSS: 30,
  MEDIUM_CVSS: 12,

  VERY_HIGH_EPSS: 30,
  HIGH_EPSS: 25,
  MODERATE_EPSS: 15,
  LOW_EPSS: 3,
} as const;

/**
 * Construit les facteurs explicables utilisés par le moteur de décision.
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
 * Calcule le score final à partir des seuls facteurs affichés.
 *
 * Cette règle garantit que :
 *
 * contributions visibles === score calculé.
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
      title: "Exploitation connue confirmée",
      description:
        "La vulnérabilité est référencée dans le catalogue CISA KEV. Une exploitation dans la nature est donc confirmée et ce signal devient déterminant pour la priorité de remédiation.",
      scoreContribution: DECISION_WEIGHTS.KNOWN_EXPLOITED,
      source: "CISA KEV",
      confidence: 100,
    };
  }

  if (signals.isKnownExploited === false) {
    return {
      id: "not-listed-in-kev",
      title: "Aucune exploitation confirmée dans CISA KEV",
      description:
        "La vulnérabilité n’est actuellement pas référencée dans le catalogue CISA KEV. Cette absence ne prouve pas qu’elle n’est pas exploitée et ne réduit pas, à elle seule, sa sévérité technique.",
      scoreContribution: 0,
      source: "CISA KEV",
      confidence: 100,
    };
  }

  return {
    id: "unknown-exploitation-status",
    title: "Statut d’exploitation non établi",
    description:
      "Le statut CISA KEV n’a pas pu être déterminé à partir des données disponibles. Ce manque d’information réduit le niveau de confiance, mais n’ajoute pas artificiellement de points au score de priorité.",
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
      title: "Sévérité technique non établie",
      description:
        "Aucun score CVSS valide n’est disponible. La sévérité technique doit être qualifiée avant de conclure sur la priorité de remédiation.",
      scoreContribution: 0,
      source: "NVD",
      confidence: 25,
    };
  }

  const confidence = signals.hasCvssVector ? 100 : 85;
  const vectorQualification = signals.hasCvssVector
    ? "Le vecteur CVSS est disponible et permet de vérifier les conditions d’exploitation publiées."
    : "Le vecteur CVSS complet n’est pas disponible ; l’interprétation repose principalement sur le score de base.";

  if (cvssScore >= 9) {
    return {
      id: "critical-cvss",
      title: "Sévérité technique critique",
      description:
        `Le score CVSS de ${cvssScore.toFixed(1)} place cette vulnérabilité dans la catégorie critique. ${vectorQualification}`,
      scoreContribution: DECISION_WEIGHTS.CRITICAL_CVSS,
      source: "NVD",
      confidence,
    };
  }

  if (cvssScore >= 7) {
    return {
      id: "high-cvss",
      title: "Sévérité technique élevée",
      description:
        `Le score CVSS de ${cvssScore.toFixed(1)} indique un impact technique potentiel élevé. ${vectorQualification}`,
      scoreContribution: DECISION_WEIGHTS.HIGH_CVSS,
      source: "NVD",
      confidence,
    };
  }

  if (cvssScore >= 4) {
    return {
      id: "medium-cvss",
      title: "Sévérité technique modérée",
      description:
        `Le score CVSS de ${cvssScore.toFixed(1)} place cette vulnérabilité dans la catégorie modérée. ${vectorQualification}`,
      scoreContribution: DECISION_WEIGHTS.MEDIUM_CVSS,
      source: "NVD",
      confidence,
    };
  }

  return {
    id: "low-cvss",
    title: "Sévérité technique faible",
    description:
      `Le score CVSS de ${cvssScore.toFixed(1)} indique une sévérité technique limitée. Le contexte d’exposition et la criticité des actifs restent toutefois à vérifier. ${vectorQualification}`,
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
      title: "Probabilité d’exploitation non établie",
      description:
        "Aucune probabilité EPSS valide n’est disponible. L’absence de ce signal réduit le niveau de confiance, sans augmenter artificiellement le score de priorité.",
      scoreContribution: 0,
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
        `Le modèle EPSS estime la probabilité d’exploitation à ${percentage}. Ce signal indique une forte vraisemblance d’activité malveillante et augmente fortement la priorité opérationnelle.`,
      scoreContribution: DECISION_WEIGHTS.VERY_HIGH_EPSS,
      source: "FIRST EPSS",
      confidence: 90,
    };
  }

  if (epssProbability >= 0.3) {
    return {
      id: "high-epss",
      title: "Probabilité d’exploitation élevée",
      description:
        `Le modèle EPSS estime la probabilité d’exploitation à ${percentage}. Ce niveau constitue un signal de menace significatif et renforce la nécessité d’un traitement rapide.`,
      scoreContribution: DECISION_WEIGHTS.HIGH_EPSS,
      source: "FIRST EPSS",
      confidence: 90,
    };
  }

  if (epssProbability >= 0.1) {
    return {
      id: "moderate-epss",
      title: "Probabilité d’exploitation modérée",
      description:
        `Le modèle EPSS estime la probabilité d’exploitation à ${percentage}. Ce signal doit être mis en regard de la sévérité technique et de l’exposition réelle des actifs.`,
      scoreContribution: DECISION_WEIGHTS.MODERATE_EPSS,
      source: "FIRST EPSS",
      confidence: 90,
    };
  }

  if (epssProbability > 0) {
    return {
      id: "low-epss",
      title: "Probabilité d’exploitation faible",
      description:
        `Le modèle EPSS estime actuellement la probabilité d’exploitation à ${percentage}. Ce niveau ne justifie pas, à lui seul, une urgence, mais il peut évoluer avec l’activité de menace.`,
      scoreContribution: DECISION_WEIGHTS.LOW_EPSS,
      source: "FIRST EPSS",
      confidence: 90,
    };
  }

  return {
    id: "minimal-epss",
    title: "Probabilité d’exploitation minimale",
    description:
      "Le modèle EPSS ne signale actuellement aucune probabilité d’exploitation mesurable. Ce résultat ne constitue pas une garantie d’absence d’exploitation et doit être réévalué si le contexte de menace évolue.",
    scoreContribution: 0,
    source: "FIRST EPSS",
    confidence: 90,
  };
}

function formatPercentage(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
