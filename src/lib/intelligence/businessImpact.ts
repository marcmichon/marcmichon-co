import type {
  BusinessImpact,
  ImpactLevel,
  IntelligenceContext,
} from "./types";

export function buildBusinessImpact<T>(
  context: IntelligenceContext<T>,
): BusinessImpact {

  const { signals } = context;

  if (signals.isKnownExploited) {
    return {
      level: "CRITICAL",

      title: "Exploitation active confirmée",

      summary:
        "Une exploitation confirmée augmente fortement le risque opérationnel si les systèmes affectés sont exposés.",

      executiveMessage:
        "Évaluez immédiatement l’exposition et priorisez la remédiation.",

      potentialConsequences: [
        "Accès non autorisé",
        "Perturbation opérationnelle",
        "Mouvement latéral",
        "Élévation de privilèges",
      ],
    };
  }

  if ((signals.cvssScore ?? 0) >= 9) {
    return {
      level: "HIGH",

      title: "Sévérité technique critique",

      summary:
        "La vulnérabilité peut entraîner un impact technique majeur si elle est exploitée avec succès.",

      executiveMessage:
        "La remédiation doit être planifiée avec une priorité opérationnelle élevée.",

      potentialConsequences: [
        "Interruption de service",
        "Compromission du système",
        "Exécution de code non autorisée",
      ],
    };
  }

  if ((signals.epssProbability ?? 0) >= 0.70) {
    return {
      level: "HIGH",

      title: "Probabilité d’exploitation élevée",

      summary:
        "Les renseignements sur la menace indiquent une forte probabilité d’exploitation à court terme.",

      executiveMessage:
        "Accélérez la remédiation avant les fenêtres de maintenance habituelles lorsque cela est possible.",

      potentialConsequences: [
        "Probabilité d’attaque accrue",
        "Perturbation opérationnelle",
      ],
    };
  }

  if ((signals.cvssScore ?? 0) >= 4) {
    return {
      level: "MEDIUM",

      title: "Impact opérationnel modéré",

      summary:
        "Une exploitation réussie pourrait affecter la disponibilité ou l’intégrité du système selon le contexte de déploiement.",

      executiveMessage:
        "Traitez la vulnérabilité dans le cadre du processus standard de gestion des vulnérabilités.",

      potentialConsequences: [
        "Perturbation localisée",
        "Impact opérationnel limité",
      ],
    };
  }

  return {
    level: "LOW",

    title: "Impact opérationnel limité",

    summary:
      "Les renseignements actuels suggèrent un impact opérationnel limité dans des conditions normales.",

    executiveMessage:
      "Poursuivez la surveillance et remédiez lors d’une maintenance courante.",

    potentialConsequences: [
      "Impact opérationnel limité",
    ],
  };
}