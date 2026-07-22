import type { IntelligenceContext } from "./types";

/**
 * Builds a deterministic executive summary from normalized intelligence.
 *
 * The wording remains cautious: the engine does not assume exposure,
 * compromise, business criticality or patch availability.
 */
export function buildExecutiveSummary<T>(
  context: IntelligenceContext<T>,
): string {
  const {
    cvssScore,
    epssProbability,
    isKnownExploited,
  } = context.signals;

  if (isKnownExploited === true) {
    return [
      "Cette vulnérabilité nécessite une attention opérationnelle immédiate, car une exploitation dans des attaques réelles a été confirmée.",
      "Une probabilité EPSS faible ou modérée ne doit pas réduire la priorité de remédiation : validez l’exposition, recherchez d’éventuels signes d’exploitation et appliquez la remédiation ou des mesures compensatoires aussi rapidement que le permet l’environnement.",
    ].join(" ");
  }

  if (typeof epssProbability === "number" && epssProbability >= 0.5) {
    return [
      "Cette vulnérabilité présente une forte probabilité d’exploitation, même si aucune exploitation confirmée n’est actuellement connue.",
      "Validez l’exposition et accélérez la remédiation, tout en maintenant une surveillance ciblée des tentatives d’exploitation.",
    ].join(" ");
  }

  if (typeof cvssScore === "number" && cvssScore >= 9) {
    return [
      "Cette vulnérabilité présente une sévérité technique critique, mais les renseignements actuels ne confirment pas d’exploitation active.",
      "Évaluez rapidement l’exposition des actifs et leur criticité métier afin de déterminer le délai de remédiation approprié.",
    ].join(" ");
  }

  if (
    typeof cvssScore !== "number" &&
    typeof epssProbability !== "number" &&
    typeof isKnownExploited !== "boolean"
  ) {
    return [
      "Les renseignements disponibles sont insuffisants pour établir une priorité opérationnelle fiable.",
      "Collectez des données complémentaires sur la vulnérabilité, son exploitation et le contexte des actifs avant toute action à fort impact.",
    ].join(" ");
  }

  return [
    "Les renseignements actuels indiquent une priorité opérationnelle faible à modérée.",
    "Poursuivez les activités habituelles de gestion des vulnérabilités et réévaluez la décision si l’exposition, les preuves d’exploitation ou le contexte métier évoluent.",
  ].join(" ");
}