/**
 * Types de données utilisés par MM IOC Analyzer.
 *
 * Ce fichier ne contient aucune logique métier.
 * Il définit uniquement la structure des données échangées entre :
 *
 * - le moteur d'extraction ;
 * - le moteur de normalisation ;
 * - l'interface Astro ;
 * - les exports JSON, CSV, TXT et PDF.
 */

/**
 * Familles d'indicateurs actuellement prises en charge.
 *
 * Les valeurs affichées correspondent volontairement aux libellés
 * utilisés dans l'interface et dans les rapports exportés.
 */
export const IOC_TYPES = [
  'IPv4',
  'IPv6',
  'Domain',
  'URL',
  'Email',
  'MD5',
  'SHA-1',
  'SHA-256',
  'SHA-512',
] as const;

/**
 * Union TypeScript générée automatiquement depuis IOC_TYPES.
 *
 * Équivalent conceptuel à :
 *
 * type IocType =
 *   | 'IPv4'
 *   | 'IPv6'
 *   | 'Domain'
 *   | 'URL'
 *   | 'Email'
 *   | 'MD5'
 *   | 'SHA-1'
 *   | 'SHA-256'
 *   | 'SHA-512';
 */
export type IocType = (typeof IOC_TYPES)[number];

/**
 * Niveau de priorité global attribué à un rapport.
 *
 * Il s'agit d'une aide à la lecture et non d'un verdict
 * automatique sur le caractère malveillant des IOC.
 */
export type IocPriority =
  | 'informational'
  | 'normal'
  | 'high'
  | 'critical';

/**
 * Niveau d'évaluation global affiché dans le rapport.
 */
export type IocAssessmentLevel =
  | 'no-indicator'
  | 'to-qualify'
  | 'investigation-recommended'
  | 'priority-investigation';

/**
 * Statut réseau ou fonctionnel d'un indicateur.
 *
 * Un IOC "public" n'est pas nécessairement malveillant.
 * Ce statut décrit sa nature technique, pas sa réputation.
 */
export type IocStatus =
  | 'public'
  | 'private'
  | 'loopback'
  | 'link-local'
  | 'reserved'
  | 'known'
  | 'unknown';

/**
 * Origine d'un IOC dans le contenu analysé.
 *
 * - direct : trouvé directement dans le texte ;
 * - extracted : dérivé d'un autre IOC, par exemple un domaine extrait d'une URL.
 */
export type IocOrigin =
  | 'direct'
  | 'extracted';

/**
 * Métadonnées spécifiques aux adresses IP.
 */
export interface IocIpMetadata {
  /**
   * Indique si l'adresse appartient à une plage privée.
   */
  private?: boolean;

  /**
   * Indique une adresse de boucle locale.
   */
  loopback?: boolean;

  /**
   * Indique une adresse link-local.
   */
  linkLocal?: boolean;

  /**
   * Version du protocole IP.
   */
  version?: 4 | 6;
}

/**
 * Métadonnées spécifiques aux URL.
 */
export interface IocUrlMetadata {
  /**
   * Nom d'hôte extrait de l'URL.
   */
  hostname?: string;

  /**
   * Chemin de la ressource.
   */
  path?: string;

  /**
   * Extension éventuelle du fichier ciblé.
   */
  extension?: string | null;

  /**
   * Protocole de l'URL.
   */
  protocol?: 'http:' | 'https:';
}

/**
 * Métadonnées communes à tous les IOC.
 */
export interface IocMetadata extends IocIpMetadata, IocUrlMetadata {
  /**
   * Indique qu'un IOC a été dérivé d'un autre IOC.
   *
   * Exemple :
   * malicious.example extrait de
   * https://malicious.example/payload.exe
   */
  extracted?: boolean;

  /**
   * Type de l'IOC source lorsqu'un indicateur est dérivé.
   */
  extractedFrom?: IocType;

  /**
   * Valeur de l'IOC ayant permis l'extraction.
   */
  sourceValue?: string;
}

/**
 * Indicateur détecté et normalisé.
 */
export interface IocItem {
  /**
   * Identifiant local unique utilisé par l'interface.
   */
  id: string;

  /**
   * Famille de l'indicateur.
   */
  type: IocType;

  /**
   * Valeur normalisée utilisée pour l'affichage,
   * la comparaison et les exports.
   */
  value: string;

  /**
   * Valeur telle qu'elle apparaissait initialement dans le texte.
   */
  rawValue: string;

  /**
   * Version neutralisée de l'indicateur.
   *
   * Exemple :
   * https://example.com
   * devient
   * hxxps://example[.]com
   */
  defangedValue: string;

  /**
   * Nature technique de l'indicateur.
   */
  status: IocStatus;

  /**
   * Origine directe ou dérivée de l'indicateur.
   */
  origin: IocOrigin;

  /**
   * Court extrait du contenu source autour de l'IOC.
   */
  context: string;

  /**
   * Nombre d'occurrences trouvées avant déduplication.
   */
  occurrences: number;

  /**
   * Position de la première occurrence dans le texte analysé.
   */
  firstIndex: number;

  /**
   * Métadonnées techniques complémentaires.
   */
  metadata: IocMetadata;
}

/**
 * Compteurs générés pendant le traitement.
 *
 * Ils permettent d'expliquer précisément ce que le moteur a fait,
 * au lieu d'afficher uniquement le nombre final d'IOC.
 */
export interface IocProcessingMetrics {
  /**
   * Nombre total de candidats trouvés avant validation.
   */
  rawDetected: number;

  /**
   * Nombre d'IOC uniques conservés.
   */
  unique: number;

  /**
   * Nombre de doublons éliminés.
   */
  duplicatesRemoved: number;

  /**
   * Nombre de candidats rejetés.
   */
  ignored: number;

  /**
   * Nombre de valeurs ayant nécessité une normalisation ou un refang.
   */
  normalized: number;

  /**
   * Nombre d'adresses IP privées détectées.
   */
  privateIps: number;

  /**
   * Nombre de domaines ajoutés à partir d'URL.
   */
  extractedDomains: number;

  /**
   * Nombre de familles distinctes présentes dans le rapport.
   */
  detectedTypes: number;
}

/**
 * Nombre d'IOC par famille.
 *
 * Partial permet de ne pas générer de propriété pour les types absents.
 *
 * Exemple :
 *
 * {
 *   IPv4: 2,
 *   Domain: 1,
 *   URL: 1
 * }
 */
export type IocTypeCounts = Partial<Record<IocType, number>>;

/**
 * Résultat de l'évaluation globale du rapport.
 */
export interface IocAssessment {
  /**
   * Identifiant technique de l'évaluation.
   */
  level: IocAssessmentLevel;

  /**
   * Niveau de priorité utilisé par l'interface.
   */
  priority: IocPriority;

  /**
   * Titre principal du rapport.
   *
   * Exemple :
   * "Investigation recommandée"
   */
  title: string;

  /**
   * Libellé court affiché dans le badge.
   *
   * Exemple :
   * "Haute priorité"
   */
  priorityLabel: string;

  /**
   * Lecture opérationnelle courte.
   *
   * Exemple :
   * "IOC exploitables"
   */
  decision: string;

  /**
   * Justification de l'évaluation.
   */
  rationale: string;
}

/**
 * Recommandation d'investigation affichée dans le rapport.
 */
export interface IocRecommendation {
  /**
   * Identifiant stable de la recommandation.
   */
  id: string;

  /**
   * Ordre d'affichage.
   */
  order: number;

  /**
   * Titre de l'action.
   */
  title: string;

  /**
   * Description opérationnelle.
   */
  description: string;

  /**
   * Types d'IOC concernés par cette action.
   */
  applicableTypes: IocType[];
}

/**
 * Métadonnées du rapport généré.
 */
export interface IocReportMetadata {
  /**
   * Identifiant unique du rapport.
   */
  reportId: string;

  /**
   * Date ISO complète.
   *
   * Exemple :
   * 2026-07-30T09:42:00.000Z
   */
  generatedAt: string;

  /**
   * Version fonctionnelle de l'outil.
   */
  toolVersion: string;

  /**
   * Empreinte SHA-256 calculée depuis le contenu du rapport.
   */
  reportHash: string;

  /**
   * Mode de traitement.
   */
  processingMode: 'local';

  /**
   * Niveau de confidentialité affiché dans le rapport.
   */
  classification: 'internal';
}

/**
 * Résultat complet retourné par le moteur IOC.
 *
 * Cet objet devient la source de vérité unique pour :
 *
 * - le rendu de l'interface ;
 * - les métriques ;
 * - le tableau des IOC ;
 * - le plan d'investigation ;
 * - les exports.
 */
export interface IocAnalysisResult {
  /**
   * Contenu brut fourni par l'utilisateur.
   */
  source: string;

  /**
   * Liste finale des IOC uniques.
   */
  items: IocItem[];

  /**
   * Compteurs du moteur.
   */
  metrics: IocProcessingMetrics;

  /**
   * Répartition des IOC par type.
   */
  typeCounts: IocTypeCounts;

  /**
   * Évaluation opérationnelle du rapport.
   */
  assessment: IocAssessment;

  /**
   * Actions d'investigation recommandées.
   */
  recommendations: IocRecommendation[];

  /**
   * Métadonnées du rapport.
   */
  metadata: IocReportMetadata;
}

/**
 * Structure minimale utilisée pendant l'extraction,
 * avant validation et enrichissement.
 */
export interface IocCandidate {
  /**
   * Valeur brute capturée par le moteur.
   */
  rawValue: string;

  /**
   * Valeur après refang et nettoyage syntaxique.
   */
  normalizedValue: string;

  /**
   * Position de la capture dans le texte source.
   */
  index: number;

  /**
   * Contexte autour de la capture.
   */
  context: string;
}

/**
 * Options configurables du moteur d'analyse.
 */
export interface IocAnalyzerOptions {
  /**
   * Ajoute automatiquement les domaines contenus dans les URL.
   */
  extractDomainsFromUrls?: boolean;

  /**
   * Conserve un extrait autour de chaque IOC.
   */
  includeContext?: boolean;

  /**
   * Nombre maximal de caractères avant et après l'IOC
   * dans le contexte généré.
   */
  contextRadius?: number;

  /**
   * Rend les domaines, URL et adresses email insensibles à la casse
   * pendant la déduplication.
   */
  caseInsensitiveNetworkIndicators?: boolean;
}

/**
 * Options par défaut du moteur.
 */
export const DEFAULT_IOC_ANALYZER_OPTIONS: Required<IocAnalyzerOptions> = {
  extractDomainsFromUrls: true,
  includeContext: true,
  contextRadius: 60,
  caseInsensitiveNetworkIndicators: true,
};