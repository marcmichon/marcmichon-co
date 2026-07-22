/**
 * ============================================================================
 * MM Intelligence Engine
 * ============================================================================
 * Shared domain models used across the Intelligence Engine.
 *
 * These models are intentionally independent from:
 *
 * - Astro;
 * - React;
 * - UI styling;
 * - external data-source payloads.
 * ============================================================================
 */

export type ExecutiveDecision =
  | "REMEDIATE_IMMEDIATELY"
  | "PRIORITIZE"
  | "PLAN_PATCHING"
  | "MONITOR";

export type ConfidenceLevel =
  | "VERY_HIGH"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type ImpactLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ActionPriority =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

/**
 * One explainable factor contributing to the final decision score.
 */
export interface ReasoningItem {
  /**
   * Stable identifier used by the engine and UI.
   */
  id: string;

  /**
   * Human-readable signal name.
   */
  title: string;

  /**
   * Explanation of how the signal affects the decision.
   */
  description: string;

  /**
   * Contribution of this signal to the decision score.
   */
  scoreContribution: number;

  /**
   * Intelligence source supporting this signal.
   */
  source?: string;

  /**
   * Reliability of this individual signal, from 0 to 100.
   */
  confidence?: number;
}

export interface ActionItem {
  /**
   * Stable identifier.
   */
  id: string;

  /**
   * Action title.
   */
  title: string;

  /**
   * Why this action matters.
   */
  description: string;

  /**
   * Operational priority.
   */
  priority: ActionPriority;

  /**
   * Can this action be automated?
   */
  automatable?: boolean;

  /**
   * Category shown in the UI.
   */
  category:
    | "ASSESSMENT"
    | "REMEDIATION"
    | "MITIGATION"
    | "MONITORING";

  /**
   * Recommended execution order.
   */
  order: number;
}

export interface BusinessImpact {
  /**
   * Overall impact level.
   */
  level: ImpactLevel;

  /**
   * Short title displayed in the Executive Brief.
   */
  title: string;

  /**
   * Executive summary.
   */
  summary: string;

  /**
   * Potential operational consequences.
   */
  potentialConsequences: string[];

  /**
   * One concise message for executives.
   */
  executiveMessage: string;
}

export interface ConfidenceResult {
  score: number;

  level: ConfidenceLevel;

  summary: string;
}

export interface DecisionResult {
  decision: ExecutiveDecision;

  title: string;

  summary: string;

  urgency: ImpactLevel;

  /**
   * Operational decision score, normalized between 0 and 100.
   */
  score: number;
}

export interface ExecutiveBrief {
  decision: DecisionResult;

  confidence: ConfidenceResult;

  businessImpact: BusinessImpact;

  reasoning: ReasoningItem[];

  analystNotes: string;

  actions: ActionItem[];
}

/**
 * Normalized vulnerability signals consumed by the Intelligence Engine.
 *
 * The engine reasons on these signals instead of depending directly on
 * NVD, KEV, EPSS or any vendor-specific payload.
 */
export interface VulnerabilitySignals {
  /**
   * CVSS base score, normalized between 0 and 10.
   */
  cvssScore?: number;

  /**
   * Whether a valid CVSS vector is available.
   */
  hasCvssVector?: boolean;

  /**
   * EPSS probability, normalized between 0 and 1.
   */
  epssProbability?: number;

  /**
   * Whether the vulnerability is listed in CISA KEV.
   *
   * true:
   * confirmed known exploitation.
   *
   * false:
   * KEV status checked, but vulnerability not listed.
   *
   * undefined:
   * KEV status unavailable or not checked.
   */
  isKnownExploited?: boolean;

  /**
   * Whether one or more weakness classifications are available.
   */
  hasWeaknessClassification?: boolean;

  /**
   * Number of independent intelligence sources.
   */
  sourceCount?: number;

  /**
   * Number of supporting references.
   */
  referenceCount?: number;

  /**
   * Whether a vulnerability description is available.
   */
  hasDescription?: boolean;

  /**
   * Whether publication or modification dates are available.
   */
  hasTimeline?: boolean;
}

/**
 * Context supplied to every Intelligence Engine module.
 *
 * The raw source remains available for traceability, while normalized
 * signals provide the stable contract used by the engine.
 */
export interface IntelligenceContext<T = unknown> {
  source: T;

  signals: VulnerabilitySignals;
}