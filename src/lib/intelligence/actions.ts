import type {
  ActionItem,
  IntelligenceContext,
  VulnerabilitySignals,
} from "./types";

/**
 * Builds the ordered operational actions recommended by the engine.
 *
 * Actions are generated only from known vulnerability intelligence.
 *
 * The engine does not assume:
 *
 * - that the asset is Internet-facing;
 * - that the vulnerable component is deployed;
 * - that compromise has occurred;
 * - that a patch is available;
 * - that the asset is business-critical.
 */
export function buildActions<T>(
  context: IntelligenceContext<T>,
): ActionItem[] {
  const { signals } = context;

  const actions: ActionItem[] = [];

  actions.push(buildExposureValidationAction(signals));

  if (signals.isKnownExploited === true) {
    actions.push(
      buildThreatHuntingAction(),
      buildImmediateRemediationAction(),
    );
  } else {
    actions.push(buildRemediationAction(signals));
  }

  if (shouldRecommendTemporaryMitigations(signals)) {
    actions.push(buildTemporaryMitigationAction());
  }

  if (shouldRecommendEnhancedSurveillering(signals)) {
    actions.push(buildEnhancedSurveilleringAction());
  }

  if (hasIncompleteIntelligence(signals)) {
    actions.push(buildAdditionalIntelligenceAction());
  }

  return sortActions(deduplicateActions(actions));
}

function buildExposureValidationAction(
  signals: VulnerabilitySignals,
): ActionItem {
  const priority =
    signals.isKnownExploited === true ||
    isVeryHighEpss(signals.epssProbability)
      ? "HIGH"
      : "MEDIUM";

  return {
    id: "validate-exposure",
    title: "Valider l’exposition des actifs",
    description:
      "Identifiez les actifs affectés, confirmez la présence du composant vulnérable et déterminez si des systèmes exposés ou critiques pour l’activité sont concernés.",
    priority,
    category: "ASSESSMENT",
    automatable: true,
    order: 10,
  };
}

function buildThreatHuntingAction(): ActionItem {
  return {
    id: "perform-threat-hunting",
    title: "Mener une recherche ciblée de compromission",
    description:
      "Recherchez dans les télémétries de sécurité les indicateurs, techniques et activités anormales associés à l’exploitation de cette vulnérabilité.",
    priority: "HIGH",
    category: "MONITORING",
    automatable: false,
    order: 20,
  };
}

function buildImmediateRemediationAction(): ActionItem {
  return {
    id: "apply-immediate-remediation",
    title: "Appliquer immédiatement la remédiation éditeur",
    description:
      "Déployez le correctif, la mise à niveau ou la mesure corrective recommandée par l’éditeur dès que les contraintes opérationnelles le permettent.",
    priority: "HIGH",
    category: "REMEDIATION",
    automatable: true,
    order: 30,
  };
}

function buildRemediationAction(
  signals: VulnerabilitySignals,
): ActionItem {
  if (
    isCriticalCvss(signals.cvssScore) ||
    isVeryHighEpss(signals.epssProbability)
  ) {
    return {
      id: "accelerate-remediation",
      title: "Accélérer la remédiation",
      description:
        "Planifiez la remédiation avant le cycle de maintenance habituel et validez la préparation du déploiement.",
      priority: "HIGH",
      category: "REMEDIATION",
      automatable: true,
      order: 30,
    };
  }

  if (isMediumOrHighCvss(signals.cvssScore)) {
    return {
      id: "plan-remediation",
      title: "Planifier la remédiation",
      description:
        "Intégrez la vulnérabilité au processus standard de remédiation et suivez son traitement jusqu’à sa clôture.",
      priority: "MEDIUM",
      category: "REMEDIATION",
      automatable: true,
      order: 30,
    };
  }

  return {
    id: "routine-remediation",
    title: "Traiter lors d’une maintenance courante",
    description:
      "Remédiez dans le cadre du processus de maintenance habituel tout en poursuivant la surveillance des renseignements sur la menace.",
    priority: "LOW",
    category: "REMEDIATION",
    automatable: true,
    order: 30,
  };
}

function buildTemporaryMitigationAction(): ActionItem {
  return {
    id: "implement-temporary-mitigations",
    title: "Mettre en œuvre des mesures compensatoires temporaires",
    description:
      "Si une remédiation immédiate est impossible, appliquez les contournements recommandés par l’éditeur, des restrictions d’accès ou des mesures compensatoires.",
    priority: "HIGH",
    category: "MITIGATION",
    automatable: false,
    order: 40,
  };
}

function buildEnhancedSurveilleringAction(): ActionItem {
  return {
    id: "increase-security-monitoring",
    title: "Renforcer la surveillance de sécurité",
    description:
      "Renforcez la surveillance des systèmes affectés et suivez l’évolution de l’activité d’exploitation, des outils publics et des renseignements sur la menace.",
    priority: "MEDIUM",
    category: "MONITORING",
    automatable: true,
    order: 50,
  };
}

function buildAdditionalIntelligenceAction(): ActionItem {
  return {
    id: "collect-additional-intelligence",
    title: "Collecter des renseignements complémentaires",
    description:
      "Complétez les informations manquantes sur la sévérité, l’exploitation, la chronologie ou les aspects techniques avant toute décision opérationnelle à fort impact.",
    priority: "MEDIUM",
    category: "ASSESSMENT",
    automatable: false,
    order: 60,
  };
}

function shouldRecommendTemporaryMitigations(
  signals: VulnerabilitySignals,
): boolean {
  return (
    signals.isKnownExploited === true ||
    isCriticalCvss(signals.cvssScore) ||
    isVeryHighEpss(signals.epssProbability)
  );
}

function shouldRecommendEnhancedSurveillering(
  signals: VulnerabilitySignals,
): boolean {
  return (
    signals.isKnownExploited === true ||
    isHighEpss(signals.epssProbability)
  );
}

function hasIncompleteIntelligence(
  signals: VulnerabilitySignals,
): boolean {
  return (
    signals.hasDescription !== true ||
    signals.hasTimeline !== true ||
    !isValidCvssScore(signals.cvssScore) ||
    !isValidEpssProbability(signals.epssProbability) ||
    typeof signals.isKnownExploited !== "boolean"
  );
}

function deduplicateActions(
  actions: ActionItem[],
): ActionItem[] {
  return Array.from(
    new Map(
      actions.map((action) => [action.id, action]),
    ).values(),
  );
}

function sortActions(
  actions: ActionItem[],
): ActionItem[] {
  return [...actions].sort(
    (first, second) => first.order - second.order,
  );
}

function isCriticalCvss(
  value: number | undefined,
): boolean {
  return isValidCvssScore(value) && value >= 9;
}

function isMediumOrHighCvss(
  value: number | undefined,
): boolean {
  return isValidCvssScore(value) && value >= 4;
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