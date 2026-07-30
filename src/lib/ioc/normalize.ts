import type { IocType } from '../../types/ioc';

/**
 * Résultat complet d'une opération de normalisation.
 *
 * Cela permet au moteur de conserver :
 *
 * - la valeur brute trouvée dans le texte ;
 * - la valeur refangée ;
 * - la valeur normalisée ;
 * - la valeur defangée ;
 * - l'information indiquant si une transformation a eu lieu.
 */
export interface IocNormalizationResult {
  rawValue: string;
  refangedValue: string;
  normalizedValue: string;
  defangedValue: string;
  wasRefanged: boolean;
  wasNormalized: boolean;
}

/**
 * Couples de remplacement utilisés pendant le refang.
 *
 * Les formes les plus spécifiques doivent être placées en premier.
 */
const REFANG_REPLACEMENTS: ReadonlyArray<
  readonly [pattern: RegExp, replacement: string]
> = [
  [/hxxps/gi, 'https'],
  [/hxxp/gi, 'http'],

  [/\[\s*:\s*\]\s*\/\s*\/?/g, '://'],
  [/\(\s*:\s*\)\s*\/\s*\/?/g, '://'],
  [/\{\s*:\s*\}\s*\/\s*\/?/g, '://'],

  [/\[\s*dot\s*\]/gi, '.'],
  [/\(\s*dot\s*\)/gi, '.'],
  [/\{\s*dot\s*\}/gi, '.'],

  [/\[\s*\.\s*\]/g, '.'],
  [/\(\s*\.\s*\)/g, '.'],
  [/\{\s*\.\s*\}/g, '.'],

  [/\[\s*at\s*\]/gi, '@'],
  [/\(\s*at\s*\)/gi, '@'],
  [/\{\s*at\s*\}/gi, '@'],

  [/\[\s*@\s*\]/g, '@'],
  [/\(\s*@\s*\)/g, '@'],
  [/\{\s*@\s*\}/g, '@'],

  [/\[\s*:\s*\]/g, ':'],
  [/\(\s*:\s*\)/g, ':'],
  [/\{\s*:\s*\}/g, ':'],
] as const;

/**
 * Ponctuation fréquemment placée après un IOC dans une phrase.
 *
 * Exemple :
 *
 * "Connexion vers https://example.com."
 *
 * Le point final appartient à la phrase et non à l'URL.
 */
const TRAILING_PUNCTUATION = /[.,;!?]+$/;

/**
 * Guillemets et caractères ouvrants pouvant précéder un IOC.
 */
const LEADING_WRAPPERS = /^[<"'`]+/;

/**
 * Guillemets et caractères fermants pouvant suivre un IOC.
 */
const TRAILING_WRAPPERS = /[>"'`]+$/;

/**
 * Hash hexadécimal.
 */
const HEXADECIMAL_VALUE = /^[a-f0-9]+$/i;

/**
 * Teste si une valeur semble contenir une notation defangée.
 */
export function isDefanged(value: string): boolean {
  return (
    /\bhxxps?\b/i.test(value) ||
    /\[\s*(?:\.|dot|@|at|:)\s*\]/i.test(value) ||
    /\(\s*(?:\.|dot|@|at|:)\s*\)/i.test(value) ||
    /\{\s*(?:\.|dot|@|at|:)\s*\}/i.test(value)
  );
}

/**
 * Transforme une valeur defangée en valeur exploitable.
 *
 * Exemples :
 *
 * hxxps://example[.]com
 * devient
 * https://example.com
 *
 * user[@]example[.]com
 * devient
 * user@example.com
 */
export function refangIoc(value: string): string {
  let result = value.trim();

  for (const [pattern, replacement] of REFANG_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Nettoie les caractères d'encadrement externes.
 *
 * Exemple :
 *
 * "<https://example.com>"
 * devient
 * https://example.com
 */
export function stripExternalWrappers(value: string): string {
  let result = value.trim();

  result = result.replace(LEADING_WRAPPERS, '');
  result = result.replace(TRAILING_WRAPPERS, '');

  return result.trim();
}

/**
 * Supprime la ponctuation terminale qui appartient probablement
 * à la phrase et non à l'IOC.
 *
 * La fonction préserve les parenthèses ou crochets équilibrés
 * faisant partie d'une URL.
 */
export function stripTrailingPunctuation(value: string): string {
  let result = value.trim();

  result = result.replace(TRAILING_PUNCTUATION, '');

  while (result.endsWith(')')) {
    const openingCount = countCharacter(result, '(');
    const closingCount = countCharacter(result, ')');

    if (closingCount <= openingCount) {
      break;
    }

    result = result.slice(0, -1);
  }

  while (result.endsWith(']')) {
    const openingCount = countCharacter(result, '[');
    const closingCount = countCharacter(result, ']');

    if (closingCount <= openingCount) {
      break;
    }

    result = result.slice(0, -1);
  }

  while (result.endsWith('}')) {
    const openingCount = countCharacter(result, '{');
    const closingCount = countCharacter(result, '}');

    if (closingCount <= openingCount) {
      break;
    }

    result = result.slice(0, -1);
  }

  return result.trim();
}

/**
 * Compte le nombre d'occurrences d'un caractère.
 */
function countCharacter(value: string, character: string): number {
  let count = 0;

  for (const current of value) {
    if (current === character) {
      count += 1;
    }
  }

  return count;
}

/**
 * Nettoyage générique appliqué avant la normalisation spécifique
 * à chaque famille d'IOC.
 */
export function cleanIocValue(value: string): string {
  return stripTrailingPunctuation(
    stripExternalWrappers(value),
  );
}

/**
 * Normalise une adresse IPv4.
 *
 * Les zéros inutiles sont supprimés afin d'améliorer
 * la déduplication.
 *
 * Exemple :
 *
 * 192.168.001.010
 * devient
 * 192.168.1.10
 *
 * La validation définitive reste confiée à validators.ts.
 */
export function normalizeIpv4(value: string): string {
  const cleaned = cleanIocValue(value);
  const octets = cleaned.split('.');

  if (octets.length !== 4) {
    return cleaned;
  }

  if (!octets.every((octet) => /^\d{1,3}$/.test(octet))) {
    return cleaned;
  }

  return octets
    .map((octet) => String(Number.parseInt(octet, 10)))
    .join('.');
}

/**
 * Normalise une adresse IPv6.
 *
 * Les caractères hexadécimaux sont convertis en minuscules.
 *
 * Une éventuelle zone d'interface est conservée :
 *
 * fe80::1%ETH0
 * devient
 * fe80::1%ETH0
 */
export function normalizeIpv6(value: string): string {
  const cleaned = cleanIocValue(value);
  const separatorIndex = cleaned.indexOf('%');

  if (separatorIndex === -1) {
    return cleaned.toLowerCase();
  }

  const address = cleaned.slice(0, separatorIndex).toLowerCase();
  const zone = cleaned.slice(separatorIndex + 1);

  return `${address}%${zone}`;
}

/**
 * Normalise un domaine DNS.
 *
 * - conversion en minuscules ;
 * - suppression d'un point final DNS ;
 * - suppression des caractères externes.
 */
export function normalizeDomain(value: string): string {
  let result = cleanIocValue(value).toLowerCase();

  while (result.endsWith('.')) {
    result = result.slice(0, -1);
  }

  return result;
}

/**
 * Normalise une adresse email.
 *
 * La partie domaine est insensible à la casse.
 *
 * La partie locale est conservée telle quelle car, même si cela est rare,
 * sa sensibilité à la casse dépend théoriquement du serveur destinataire.
 */
export function normalizeEmail(value: string): string {
  const cleaned = cleanIocValue(value);
  const separatorIndex = cleaned.lastIndexOf('@');

  if (separatorIndex <= 0) {
    return cleaned;
  }

  const localPart = cleaned.slice(0, separatorIndex);
  const domainPart = cleaned.slice(separatorIndex + 1);

  return `${localPart}@${normalizeDomain(domainPart)}`;
}

/**
 * Normalise une URL HTTP ou HTTPS.
 *
 * Cette fonction utilise l'API URL native du navigateur.
 *
 * Elle réalise notamment :
 *
 * - la mise en minuscules du protocole ;
 * - la mise en minuscules du hostname ;
 * - la suppression des ports par défaut ;
 * - la conservation du chemin, de la query string et du fragment.
 *
 * En cas d'URL non analysable, la valeur nettoyée est retournée telle quelle.
 */
export function normalizeUrl(value: string): string {
  const cleaned = cleanIocValue(value);

  try {
    const parsedUrl = new URL(cleaned);

    if (
      parsedUrl.protocol !== 'http:' &&
      parsedUrl.protocol !== 'https:'
    ) {
      return cleaned;
    }

    parsedUrl.protocol = parsedUrl.protocol.toLowerCase();
    parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

    if (
      (parsedUrl.protocol === 'http:' && parsedUrl.port === '80') ||
      (parsedUrl.protocol === 'https:' && parsedUrl.port === '443')
    ) {
      parsedUrl.port = '';
    }

    return parsedUrl.toString();
  } catch {
    return cleaned;
  }
}

/**
 * Normalise un hash.
 *
 * Les hashes sont affichés en minuscules pour assurer une
 * déduplication indépendante de la casse.
 */
export function normalizeHash(value: string): string {
  const cleaned = cleanIocValue(value);

  if (!HEXADECIMAL_VALUE.test(cleaned)) {
    return cleaned;
  }

  return cleaned.toLowerCase();
}

/**
 * Normalise une valeur en fonction de son type IOC.
 */
export function normalizeIocValue(
  type: IocType,
  value: string,
): string {
  switch (type) {
    case 'IPv4':
      return normalizeIpv4(value);

    case 'IPv6':
      return normalizeIpv6(value);

    case 'Domain':
      return normalizeDomain(value);

    case 'URL':
      return normalizeUrl(value);

    case 'Email':
      return normalizeEmail(value);

    case 'MD5':
    case 'SHA-1':
    case 'SHA-256':
    case 'SHA-512':
      return normalizeHash(value);

    default:
      return cleanIocValue(value);
  }
}

/**
 * Defang d'une URL.
 *
 * Exemple :
 *
 * https://example.com/path
 * devient
 * hxxps://example[.]com/path
 */
export function defangUrl(value: string): string {
  const normalized = normalizeUrl(value);

  return normalized
    .replace(/^https:\/\//i, 'hxxps://')
    .replace(/^http:\/\//i, 'hxxp://')
    .replace(/\./g, '[.]');
}

/**
 * Defang d'un domaine.
 */
export function defangDomain(value: string): string {
  return normalizeDomain(value).replace(/\./g, '[.]');
}

/**
 * Defang d'une adresse email.
 */
export function defangEmail(value: string): string {
  const normalized = normalizeEmail(value);
  const separatorIndex = normalized.lastIndexOf('@');

  if (separatorIndex <= 0) {
    return normalized.replace(/\./g, '[.]');
  }

  const localPart = normalized.slice(0, separatorIndex);
  const domainPart = normalized.slice(separatorIndex + 1);

  return `${localPart}[@]${domainPart.replace(/\./g, '[.]')}`;
}

/**
 * Defang d'une adresse IPv4.
 */
export function defangIpv4(value: string): string {
  return normalizeIpv4(value).replace(/\./g, '[.]');
}

/**
 * Defang d'une adresse IPv6.
 *
 * On conserve les deux-points car ils ne sont généralement pas
 * rendus cliquables par les outils bureautiques et navigateurs.
 */
export function defangIpv6(value: string): string {
  return normalizeIpv6(value);
}

/**
 * Retourne une version neutralisée d'un IOC.
 *
 * Les hashes ne nécessitent pas de defang particulier.
 */
export function defangIoc(
  type: IocType,
  value: string,
): string {
  switch (type) {
    case 'URL':
      return defangUrl(value);

    case 'Domain':
      return defangDomain(value);

    case 'Email':
      return defangEmail(value);

    case 'IPv4':
      return defangIpv4(value);

    case 'IPv6':
      return defangIpv6(value);

    case 'MD5':
    case 'SHA-1':
    case 'SHA-256':
    case 'SHA-512':
      return normalizeHash(value);

    default:
      return value;
  }
}

/**
 * Génère une clé stable utilisée pour la déduplication.
 *
 * Les domaines, URL, emails et hashes sont comparés de manière
 * insensible à la casse.
 *
 * Le type est inclus dans la clé afin d'éviter toute collision
 * entre plusieurs familles d'IOC.
 */
export function createIocDeduplicationKey(
  type: IocType,
  value: string,
): string {
  const normalizedValue = normalizeIocValue(type, value);

  switch (type) {
    case 'Domain':
    case 'URL':
    case 'Email':
    case 'MD5':
    case 'SHA-1':
    case 'SHA-256':
    case 'SHA-512':
    case 'IPv6':
      return `${type}:${normalizedValue.toLowerCase()}`;

    case 'IPv4':
    default:
      return `${type}:${normalizedValue}`;
  }
}

/**
 * Réalise le pipeline complet de normalisation d'une valeur.
 */
export function normalizeIoc(
  type: IocType,
  rawValue: string,
): IocNormalizationResult {
  const refangedValue = refangIoc(rawValue);
  const normalizedValue = normalizeIocValue(
    type,
    refangedValue,
  );
  const defangedValue = defangIoc(
    type,
    normalizedValue,
  );

  return {
    rawValue,
    refangedValue,
    normalizedValue,
    defangedValue,
    wasRefanged: refangedValue !== rawValue.trim(),
    wasNormalized:
      normalizedValue !== refangedValue ||
      refangedValue !== rawValue.trim(),
  };
}