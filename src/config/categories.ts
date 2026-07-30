/**
 * Editorial categories used across marcmichon.co.
 *
 * This file is the single source of truth for:
 * - category labels
 * - visual accents
 * - URLs
 * - descriptions
 * - illustration themes
 */

export const CATEGORY_IDS = [
  "vm",
  "endpoint",
  "engineering",
  "exposure",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface EditorialCategory {
  id: CategoryId;

  /**
   * Full public name displayed on article pages and cards.
   */
  label: string;

  /**
   * Short name available for compact interfaces.
   */
  shortLabel: string;

  /**
   * URL-safe category identifier.
   */
  slug: string;

  /**
   * Main accent colour.
   */
  color: string;

  /**
   * Soft background used for badges and callouts.
   */
  softColor: string;

  /**
   * Darker accent available for hover states.
   */
  darkColor: string;

  /**
   * CSS custom property associated with the category.
   */
  cssVariable: string;

  /**
   * Editorial purpose of the pillar.
   */
  description: string;

  /**
   * Visual direction used for illustrations.
   */
  imageTheme: string;
}

export const categories = {
  vm: {
    id: "vm",
    label: "VM Fundamentals",
    shortLabel: "VM",
    slug: "vm-fundamentals",

    color: "#2563EB",
    softColor: "rgba(37, 99, 235, 0.10)",
    darkColor: "#1D4ED8",
    cssVariable: "--category-vm",

    description:
      "Comprendre les vulnérabilités, les actifs, les scanners et les mécanismes fondamentaux de la gestion des vulnérabilités.",

    imageTheme:
      "Deep blue infrastructure, assets, scanners, networks and datacenter architecture.",
  },

  endpoint: {
    id: "endpoint",
    label: "Endpoint Security",
    shortLabel: "Endpoint",
    slug: "endpoint-security",

    color: "#DC2626",
    softColor: "rgba(220, 38, 38, 0.10)",
    darkColor: "#B91C1C",
    cssVariable: "--category-endpoint",

    description:
      "Explorer la protection des endpoints, la télémétrie, la détection et les limites opérationnelles des plateformes EDR.",

    imageTheme:
      "Deep blue environment with red accents, endpoints, telemetry, detection and protection layers.",
  },

  engineering: {
    id: "engineering",
    label: "Security Platform Engineering",
    shortLabel: "Platform Engineering",
    slug: "security-platform-engineering",

    color: "#7C3AED",
    softColor: "rgba(124, 58, 237, 0.10)",
    darkColor: "#6D28D9",
    cssVariable: "--category-engineering",

    description:
      "Analyser le cycle de vie, l’architecture, la maturité et l’évolution des plateformes de sécurité.",

    imageTheme:
      "Deep blue architecture with purple accents, modular platforms, holographic layers and interconnected services.",
  },

  exposure: {
    id: "exposure",
    label: "Exposure Management",
    shortLabel: "Exposure",
    slug: "exposure-management",

    color: "#F97316",
    softColor: "rgba(249, 115, 22, 0.10)",
    darkColor: "#EA580C",
    cssVariable: "--category-exposure",

    description:
      "Relier les actifs, les vulnérabilités et les chemins d’exposition afin de mieux comprendre et prioriser le risque.",

    imageTheme:
      "Deep blue attack surface with orange highlights, exposure graphs, risk paths and prioritisation.",
  },
} satisfies Record<CategoryId, EditorialCategory>;

/**
 * Returns the configuration associated with a category.
 */
export function getCategory(categoryId: CategoryId): EditorialCategory {
  return categories[categoryId];
}

/**
 * Runtime validation for values coming from frontmatter or external data.
 */
export function isCategoryId(value: string): value is CategoryId {
  return CATEGORY_IDS.includes(value as CategoryId);
}