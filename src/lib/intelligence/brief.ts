import { buildActions } from "./actions";
import { buildBusinessImpact } from "./businessImpact";
import { buildConfidence } from "./confidence";
import { buildDecision } from "./decision";
import { buildExecutiveSummary } from "./executiveSummary";
import { buildReasoning } from "./reasoning";

import type { IntelligenceContext } from "./types";

/**
 * Primary public entry point of the MM Security Intelligence Decision Engine.
 */
export function buildExecutiveBrief<T>(
  context: IntelligenceContext<T>,
) {
  return {
    executiveSummary: buildExecutiveSummary(context),
    decision: buildDecision(context),
    confidence: buildConfidence(context),
    businessImpact: buildBusinessImpact(context),
    actions: buildActions(context),
    reasoning: buildReasoning(context),
    analystNotes: buildAnalystNotes(),
  };
}

function buildAnalystNotes(): string {
  return [
    "Cette évaluation repose sur les renseignements de vulnérabilité actuellement disponibles.",
    "L’exposition des actifs, leur criticité métier, les mesures compensatoires et la faisabilité de la remédiation doivent être validées avant toute action à fort impact.",
  ].join(" ");
}