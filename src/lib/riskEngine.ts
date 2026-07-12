import type { RiskInput, RiskResult } from "./types";

export function calculateRisk(input: RiskInput): RiskResult {

    let score = 0;

    score += input.probability * 2;

    score += input.impact * 2;

    score += input.cvss / 2;

    score += input.epss / 10;

    if (input.exposure === "internet")
        score += 4;

    if (input.exploit)
        score += 3;

    if (input.controls.edr)
        score -= 1;

    if (input.controls.waf)
        score -= 1;

    if (input.controls.mfa)
        score -= 1;

    if (input.controls.segmentation)
        score -= 1;

    if (input.controls.backup)
        score -= 0.5;

    if (input.controls.soc)
        score -= 0.5;

    let level = "Faible";
    let color = "#22c55e";

    if (score >= 18) {
        level = "Critique";
        color = "#dc2626";
    }
    else if (score >= 14) {
        level = "Élevé";
        color = "#ea580c";
    }
    else if (score >= 9) {
        level = "Modéré";
        color = "#eab308";
    }

    return {

        score: Math.round(score),

        level,

        color,

        recommendation: ""

    };

}