import type {
  ActionItem,
  IntelligenceContext,
  VulnerabilitySignals,
} from "./types";

/**
 * Builds an ordered and explainable operational response plan.
 *
 * The engine only recommends actions supported by normalized vulnerability
 * intelligence. It never assumes that:
 *
 * - the vulnerable component is deployed;
 * - an affected asset is exposed to the Internet;
 * - exploitation has occurred in the local environment;
 * - a vendor patch is available;
 * - the affected asset is business-critical.
 */
export function buildActions<T>(
  context: IntelligenceContext<T>,
): ActionItem[] {
  const { signals } = context;
  const actions: ActionItem[] = [buildExposureValidationAction(signals)];

  if (signals.isKnownExploited === true) {
    actions.push(
      buildThreatHuntingAction(),
      buildImmediateRemediationAction(),
      buildTemporaryMitigationAction(),
      buildEnhancedMonitoringAction("HIGH"),
    );
  } else {
    actions.push(buildRemediationAction(signals));

    if (shouldRecommendTemporaryMitigations(signals)) {
      actions.push(buildTemporaryMitigationAction());
    }

    if (shouldRecommendEnhancedMonitoring(signals)) {
      actions.push(buildEnhancedMonitoringAction("MEDIUM"));
    }
  }

  if (hasIncompleteIntelligence(signals)) {
    actions.push(buildAdditionalIntelligenceAction());
  }

  return sortActions(deduplicateActions(actions));
}

function buildExposureValidationAction(
  signals: VulnerabilitySignals,
): ActionItem {
  const urgentQualification =
    signals.isKnownExploited === true ||
    isCriticalCvss(signals.cvssScore) ||
    isVeryHighEpss(signals.epssProbability);

  return {
    id: "validate-exposure",
    title: urgentQualification
      ? "Qualifier immédiatement le périmètre exposé"
      : "Valider le périmètre affecté",
    description:
      "Confirmer où le composant est réellement déployé et déterminer quels actifs nécessitent une action prioritaire.",
    objective:
      "Établir un périmètre affecté fiable avant toute remédiation ou mesure compensatoire.",
    checklist: [
      "Identifier les actifs susceptibles d’exécuter le produit ou le composant concerné.",
      "Vérifier les versions installées et les comparer aux versions affectées publiées.",
      "Confirmer la présence réelle du composant vulnérable sur chaque actif.",
      "Qualifier l’exposition : Internet, VPN, réseau interne, administration ou flux applicatifs.",
      "Documenter la criticité opérationnelle et le propriétaire de chaque actif concerné.",
    ],
    evidenceSources: ["CMDB", "Inventaire logiciel", "Scanner de vulnérabilités", "Configuration réseau"],
    priority: urgentQualification ? "HIGH" : "MEDIUM",
    category: "ASSESSMENT",
    automatable: true,
    order: 10,
  };
}

function buildThreatHuntingAction(): ActionItem {
  return {
    id: "perform-threat-hunting",
    title: "Rechercher des traces d’exploitation",
    description:
      "Rechercher des comportements compatibles avec une tentative d’exploitation ou une compromission sur le périmètre confirmé.",
    objective:
      "Déterminer si la vulnérabilité a pu être exploitée dans l’environnement.",
    checklist: [
      "Rechercher les alertes EDR associées aux actifs et processus concernés.",
      "Examiner les journaux système, applicatifs et de sécurité autour des périodes suspectes.",
      "Analyser les flux réseau, Proxy, Firewall et DNS liés aux services exposés.",
      "Contrôler les événements d’authentification, créations de comptes et élévations de privilèges.",
      "Conserver les éléments utiles à une investigation complémentaire ou à la réponse à incident.",
    ],
    evidenceSources: ["EDR", "SIEM", "Firewall", "Proxy", "DNS", "Journaux d’authentification"],
    priority: "HIGH",
    category: "MONITORING",
    automatable: false,
    order: 20,
  };
}

function buildImmediateRemediationAction(): ActionItem {
  return {
    id: "apply-immediate-remediation",
    title: "Engager la remédiation immédiate",
    description:
      "Appliquer la mesure corrective validée sur les actifs confirmés comme vulnérables et contrôler son efficacité.",
    objective:
      "Réduire immédiatement la surface d’attaque tout en maîtrisant le risque opérationnel du changement.",
    checklist: [
      "Vérifier l’avis de sécurité et les versions corrigées publiées par l’éditeur.",
      "Confirmer la compatibilité du correctif, de la mise à niveau ou du contournement.",
      "Tester la mesure corrective sur un périmètre représentatif lorsque le contexte le permet.",
      "Déployer en priorité sur les actifs exposés ou critiques confirmés.",
      "Relancer un contrôle de version ou un scan afin de valider la remédiation.",
    ],
    evidenceSources: ["Avis éditeur", "Gestion des correctifs", "Outil de déploiement", "Scanner de vulnérabilités"],
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
    isCriticalCvss(signals.cvssScore) &&
    isHighEpss(signals.epssProbability)
  ) {
    return {
      id: "accelerate-remediation",
      title: "Traiter la vulnérabilité en priorité",
      description:
        "Préparer une correction prioritaire sur le périmètre confirmé sans attendre le cycle de maintenance courant.",
      objective:
        "Réduire rapidement le risque d’exploitation sur les actifs réellement concernés.",
      checklist: remediationChecklist(),
      evidenceSources: remediationEvidenceSources(),
      priority: "HIGH",
      category: "REMEDIATION",
      automatable: true,
      order: 30,
    };
  }

  if (isCriticalCvss(signals.cvssScore)) {
    return {
      id: "prioritize-critical-remediation",
      title: "Prioriser la remédiation",
      description:
        "Intégrer la correction au prochain créneau prioritaire sur les actifs confirmés comme vulnérables.",
      objective:
        "Traiter une sévérité technique critique sans attendre l’apparition d’un signal KEV supplémentaire.",
      checklist: remediationChecklist(),
      evidenceSources: remediationEvidenceSources(),
      priority: "HIGH",
      category: "REMEDIATION",
      automatable: true,
      order: 30,
    };
  }

  if (isVeryHighEpss(signals.epssProbability)) {
    return {
      id: "prioritize-probable-exploitation",
      title: "Accélérer le traitement selon le risque d’exploitation",
      description:
        "Avancer la remédiation avant le prochain cycle standard compte tenu du niveau de probabilité d’exploitation.",
      objective:
        "Réduire la fenêtre d’exposition sur le périmètre confirmé.",
      checklist: remediationChecklist(),
      evidenceSources: remediationEvidenceSources(),
      priority: "HIGH",
      category: "REMEDIATION",
      automatable: true,
      order: 30,
    };
  }

  if (isHighCvss(signals.cvssScore) || isHighEpss(signals.epssProbability)) {
    return {
      id: "plan-priority-remediation",
      title: "Planifier une remédiation prioritaire",
      description:
        "Planifier une correction prioritaire et suivre son exécution jusqu’à validation technique.",
      objective:
        "Assurer un traitement maîtrisé du périmètre confirmé dans un délai cohérent avec le risque.",
      checklist: remediationChecklist(),
      evidenceSources: remediationEvidenceSources(),
      priority: "HIGH",
      category: "REMEDIATION",
      automatable: true,
      order: 30,
    };
  }

  if (isMediumCvss(signals.cvssScore)) {
    return {
      id: "plan-remediation",
      title: "Planifier la remédiation",
      description:
        "Intégrer la vulnérabilité au processus standard après validation du périmètre affecté.",
      objective:
        "Planifier, tracer et valider la correction sur les actifs concernés.",
      checklist: remediationChecklist(),
      evidenceSources: remediationEvidenceSources(),
      priority: "MEDIUM",
      category: "REMEDIATION",
      automatable: true,
      order: 30,
    };
  }

  return {
    id: "routine-remediation",
    title: "Traiter dans le cycle de maintenance courant",
    description:
      "Traiter la vulnérabilité dans le cycle de maintenance courant après confirmation du périmètre affecté.",
    objective:
      "Maintenir la maîtrise du risque sans engager une opération d’urgence non justifiée.",
    checklist: remediationChecklist(),
    evidenceSources: remediationEvidenceSources(),
    priority: "LOW",
    category: "REMEDIATION",
    automatable: true,
    order: 30,
  };
}

function buildTemporaryMitigationAction(): ActionItem {
  return {
    id: "implement-temporary-mitigations",
    title: "Mettre en place des mesures compensatoires",
    description:
      "Réduire temporairement l’exposition lorsque la correction ne peut pas être appliquée dans le délai cible.",
    objective:
      "Diminuer la probabilité ou l’impact d’une exploitation pendant la fenêtre de remédiation.",
    checklist: [
      "Vérifier les mesures de contournement et restrictions recommandées par l’éditeur.",
      "Restreindre l’accès au service aux seuls réseaux, comptes ou flux nécessaires.",
      "Appliquer un filtrage Firewall, WAF, Proxy ou ACL lorsque le vecteur le permet.",
      "Segmenter ou isoler temporairement les actifs les plus exposés.",
      "Documenter la mesure temporaire, sa date d’expiration et le retour à l’état nominal.",
    ],
    evidenceSources: ["Avis éditeur", "Firewall", "WAF", "Proxy", "Configuration réseau"],
    priority: "HIGH",
    category: "MITIGATION",
    automatable: false,
    order: 40,
  };
}

function buildEnhancedMonitoringAction(
  priority: "HIGH" | "MEDIUM",
): ActionItem {
  return {
    id: "increase-security-monitoring",
    title: "Renforcer la surveillance des actifs concernés",
    description:
      "Augmenter temporairement la visibilité sur les actifs concernés et surveiller l’évolution de la menace.",
    objective:
      "Détecter rapidement une tentative d’exploitation et réévaluer la priorité si de nouveaux signaux apparaissent.",
    checklist: [
      "Créer ou adapter les recherches SIEM liées au produit, au service et au vecteur d’attaque.",
      "Vérifier la couverture EDR et la remontée des journaux sur les actifs concernés.",
      "Surveiller les flux réseau, erreurs applicatives et événements d’authentification anormaux.",
      "Suivre les mises à jour éditeur, CISA KEV, EPSS et la disponibilité éventuelle de code d’exploitation.",
      "Définir les critères d’escalade vers une investigation ou une réponse à incident.",
    ],
    evidenceSources: ["SIEM", "EDR", "Firewall", "Proxy", "CISA KEV", "FIRST EPSS"],
    priority,
    category: "MONITORING",
    automatable: true,
    order: 50,
  };
}

function buildAdditionalIntelligenceAction(): ActionItem {
  return {
    id: "collect-additional-intelligence",
    title: "Compléter les données nécessaires à la décision",
    description:
      "Compléter les informations nécessaires avant toute décision opérationnelle à fort impact.",
    objective:
      "Réduire l’incertitude et éviter une priorisation fondée sur des données incomplètes.",
    checklist: [
      "Vérifier le score et le vecteur CVSS auprès de la source de référence.",
      "Confirmer les produits, versions et configurations réellement affectés.",
      "Contrôler le statut CISA KEV et la probabilité FIRST EPSS.",
      "Consulter l’avis éditeur et les références techniques disponibles.",
      "Documenter explicitement les hypothèses qui restent non vérifiées.",
    ],
    evidenceSources: ["NVD", "FIRST EPSS", "CISA KEV", "Avis éditeur"],
    priority: "MEDIUM",
    category: "ASSESSMENT",
    automatable: false,
    order: 60,
  };
}

function remediationChecklist(): string[] {
  return [
    "Vérifier l’avis éditeur, les versions corrigées et les éventuels prérequis.",
    "Confirmer les actifs et versions réellement concernés avant déploiement.",
    "Évaluer les dépendances, contraintes de disponibilité et procédure de retour arrière.",
    "Tester puis déployer la correction selon la criticité et l’exposition des actifs.",
    "Contrôler la version, relancer un scan et documenter la clôture de la remédiation.",
  ];
}

function remediationEvidenceSources(): string[] {
  return [
    "Avis éditeur",
    "CMDB",
    "Gestion des correctifs",
    "Outil de déploiement",
    "Scanner de vulnérabilités",
  ];
}

function shouldRecommendTemporaryMitigations(
  signals: VulnerabilitySignals,
): boolean {
  return (
    isCriticalCvss(signals.cvssScore) ||
    isVeryHighEpss(signals.epssProbability)
  );
}

function shouldRecommendEnhancedMonitoring(
  signals: VulnerabilitySignals,
): boolean {
  return isHighEpss(signals.epssProbability);
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

function deduplicateActions(actions: ActionItem[]): ActionItem[] {
  return Array.from(
    new Map(actions.map((action) => [action.id, action])).values(),
  );
}

function sortActions(actions: ActionItem[]): ActionItem[] {
  return [...actions].sort(
    (first, second) => first.order - second.order,
  );
}

function isCriticalCvss(value: number | undefined): boolean {
  return isValidCvssScore(value) && value >= 9;
}

function isHighCvss(value: number | undefined): boolean {
  return isValidCvssScore(value) && value >= 7 && value < 9;
}

function isMediumCvss(value: number | undefined): boolean {
  return isValidCvssScore(value) && value >= 4 && value < 7;
}

function isHighEpss(value: number | undefined): boolean {
  return isValidEpssProbability(value) && value >= 0.3;
}

function isVeryHighEpss(value: number | undefined): boolean {
  return isValidEpssProbability(value) && value >= 0.7;
}

function isValidCvssScore(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10;
}

function isValidEpssProbability(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}
