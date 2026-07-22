import type { VulnerabilityExplorerResult } from "../../types/risk";
import type { IntelligenceContext } from "./types";

export function toIntelligenceContext(
  vulnerability: VulnerabilityExplorerResult,
): IntelligenceContext<VulnerabilityExplorerResult> {
  const availableSourceCount = [
    vulnerability.sources.nvd,
    vulnerability.sources.epss,
    vulnerability.sources.kev,
  ].filter(Boolean).length;

  return {
    source: vulnerability,

    signals: {
      cvssScore: vulnerability.cvss.score ?? undefined,

      hasCvssVector: Boolean(
        vulnerability.cvss.vector,
      ),

      epssProbability:
        vulnerability.epss.score ?? undefined,

      isKnownExploited:
        vulnerability.kev.listed,

      hasWeaknessClassification:
        vulnerability.cwes.length > 0,

      sourceCount: availableSourceCount,

      referenceCount:
        vulnerability.references.length,

      hasDescription: Boolean(
        vulnerability.description?.trim(),
      ),

      hasTimeline: Boolean(
        vulnerability.published &&
          vulnerability.lastModified,
      ),
    },
  };
}