import type {
  IocMetadata,
  IocStatus,
  IocType,
} from '../../types/ioc';

import {
  cleanIocValue,
  normalizeDomain,
  normalizeEmail,
  normalizeHash,
  normalizeIocValue,
  normalizeIpv4,
  normalizeIpv6,
  normalizeUrl,
} from './normalize';

/**
 * Résultat détaillé d'une validation IOC.
 *
 * Le moteur ne reçoit pas seulement un booléen.
 * Il récupère également :
 *
 * - la valeur normalisée ;
 * - le statut technique ;
 * - les métadonnées utiles à l'interface ;
 * - une raison en cas de rejet.
 */
export interface IocValidationResult {
  valid: boolean;
  type: IocType;
  normalizedValue: string;
  status: IocStatus;
  metadata: IocMetadata;
  reason?: string;
}

/**
 * Résultat spécialisé d'une classification IPv4.
 */
interface Ipv4Classification {
  status: IocStatus;
  private: boolean;
  loopback: boolean;
  linkLocal: boolean;
  reserved: boolean;
}

/**
 * Résultat spécialisé d'une classification IPv6.
 */
interface Ipv6Classification {
  status: IocStatus;
  private: boolean;
  loopback: boolean;
  linkLocal: boolean;
  reserved: boolean;
}

/**
 * Longueurs attendues pour chaque famille de hash.
 */
const HASH_LENGTHS = {
  MD5: 32,
  'SHA-1': 40,
  'SHA-256': 64,
  'SHA-512': 128,
} as const satisfies Partial<Record<IocType, number>>;

/**
 * Valeur hexadécimale stricte.
 */
const HEXADECIMAL_PATTERN = /^[a-f0-9]+$/i;

/**
 * Label DNS valide.
 *
 * Contraintes :
 *
 * - 1 à 63 caractères ;
 * - commence et se termine par un caractère alphanumérique ;
 * - peut contenir des tirets au milieu.
 */
const DOMAIN_LABEL_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

/**
 * TLD alphabétique.
 *
 * La vérification ne cherche pas à confirmer que le TLD existe réellement.
 * Elle vérifie seulement sa forme syntaxique.
 */
const TOP_LEVEL_DOMAIN_PATTERN = /^[a-z]{2,63}$/i;

/**
 * Forme classique d'une adresse email.
 *
 * L'objectif est de traiter les emails rencontrés dans les alertes,
 * rapports, journaux et tickets SOC, sans implémenter toute la RFC 5322.
 */
const EMAIL_LOCAL_PART_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i;

/**
 * Retire une éventuelle zone d'interface IPv6.
 *
 * Exemple :
 *
 * fe80::1%eth0
 * devient
 * fe80::1
 */
function removeIpv6Zone(value: string): string {
  const zoneIndex = value.indexOf('%');

  return zoneIndex === -1
    ? value
    : value.slice(0, zoneIndex);
}

/**
 * Convertit une adresse IPv4 en quatre nombres.
 */
function parseIpv4Octets(value: string): number[] | null {
  const normalized = normalizeIpv4(value);
  const parts = normalized.split('.');

  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }

    return Number.parseInt(part, 10);
  });

  if (
    octets.some(
      (octet) =>
        Number.isNaN(octet) ||
        octet < 0 ||
        octet > 255,
    )
  ) {
    return null;
  }

  return octets;
}

/**
 * Vérifie si une IPv4 appartient à une plage CIDR.
 */
function ipv4MatchesCidr(
  octets: number[],
  network: readonly [number, number, number, number],
  prefixLength: number,
): boolean {
  const addressValue =
    ((octets[0] << 24) |
      (octets[1] << 16) |
      (octets[2] << 8) |
      octets[3]) >>>
    0;

  const networkValue =
    ((network[0] << 24) |
      (network[1] << 16) |
      (network[2] << 8) |
      network[3]) >>>
    0;

  const mask =
    prefixLength === 0
      ? 0
      : (0xffffffff << (32 - prefixLength)) >>> 0;

  return (addressValue & mask) === (networkValue & mask);
}

/**
 * Classification technique d'une IPv4.
 *
 * La classification sert uniquement à décrire la portée réseau.
 * Elle ne constitue jamais un verdict de réputation.
 */
function classifyIpv4(
  octets: number[],
): Ipv4Classification {
  const isPrivate =
    ipv4MatchesCidr(octets, [10, 0, 0, 0], 8) ||
    ipv4MatchesCidr(octets, [172, 16, 0, 0], 12) ||
    ipv4MatchesCidr(octets, [192, 168, 0, 0], 16);

  const isLoopback = ipv4MatchesCidr(
    octets,
    [127, 0, 0, 0],
    8,
  );

  const isLinkLocal = ipv4MatchesCidr(
    octets,
    [169, 254, 0, 0],
    16,
  );

  const isReserved =
    ipv4MatchesCidr(octets, [0, 0, 0, 0], 8) ||
    ipv4MatchesCidr(octets, [100, 64, 0, 0], 10) ||
    ipv4MatchesCidr(octets, [192, 0, 0, 0], 24) ||
    ipv4MatchesCidr(octets, [192, 0, 2, 0], 24) ||
    ipv4MatchesCidr(octets, [192, 88, 99, 0], 24) ||
    ipv4MatchesCidr(octets, [198, 18, 0, 0], 15) ||
    ipv4MatchesCidr(octets, [198, 51, 100, 0], 24) ||
    ipv4MatchesCidr(octets, [203, 0, 113, 0], 24) ||
    ipv4MatchesCidr(octets, [224, 0, 0, 0], 4) ||
    ipv4MatchesCidr(octets, [240, 0, 0, 0], 4);

  if (isLoopback) {
    return {
      status: 'loopback',
      private: false,
      loopback: true,
      linkLocal: false,
      reserved: false,
    };
  }

  if (isLinkLocal) {
    return {
      status: 'link-local',
      private: false,
      loopback: false,
      linkLocal: true,
      reserved: false,
    };
  }

  if (isPrivate) {
    return {
      status: 'private',
      private: true,
      loopback: false,
      linkLocal: false,
      reserved: false,
    };
  }

  if (isReserved) {
    return {
      status: 'reserved',
      private: false,
      loopback: false,
      linkLocal: false,
      reserved: true,
    };
  }

  return {
    status: 'public',
    private: false,
    loopback: false,
    linkLocal: false,
    reserved: false,
  };
}

/**
 * Validation stricte d'une adresse IPv4.
 */
export function validateIpv4(
  value: string,
): IocValidationResult {
  const normalizedValue = normalizeIpv4(value);
  const octets = parseIpv4Octets(normalizedValue);

  if (!octets) {
    return {
      valid: false,
      type: 'IPv4',
      normalizedValue,
      status: 'unknown',
      metadata: {
        version: 4,
      },
      reason: 'Adresse IPv4 syntaxiquement invalide.',
    };
  }

  const classification = classifyIpv4(octets);

  return {
    valid: true,
    type: 'IPv4',
    normalizedValue,
    status: classification.status,
    metadata: {
      version: 4,
      private: classification.private,
      loopback: classification.loopback,
      linkLocal: classification.linkLocal,
    },
  };
}

/**
 * Vérifie la syntaxe d'une IPv6 sans dépendre d'une bibliothèque externe.
 *
 * L'algorithme prend en charge :
 *
 * - les formes complètes ;
 * - les formes compressées ;
 * - les IPv4 intégrées ;
 * - les zones d'interface.
 */
function isValidIpv6Syntax(value: string): boolean {
  const address = removeIpv6Zone(
    normalizeIpv6(value),
  );

  if (!address.includes(':')) {
    return false;
  }

  if (/[^a-f0-9:.]/i.test(address)) {
    return false;
  }

  const doubleColonMatches = address.match(/::/g);

  if ((doubleColonMatches?.length ?? 0) > 1) {
    return false;
  }

  let workingAddress = address;
  let embeddedIpv4Groups = 0;

  const lastColonIndex = workingAddress.lastIndexOf(':');
  const lastPart = workingAddress.slice(lastColonIndex + 1);

  if (lastPart.includes('.')) {
    const embeddedIpv4 = parseIpv4Octets(lastPart);

    if (!embeddedIpv4) {
      return false;
    }

    embeddedIpv4Groups = 2;
    workingAddress =
      workingAddress.slice(0, lastColonIndex) + ':ipv4';
  }

  const hasCompression = workingAddress.includes('::');

  const groups = workingAddress
    .split(':')
    .filter((group) => group.length > 0);

  let groupCount = embeddedIpv4Groups;

  for (const group of groups) {
    if (group === 'ipv4') {
      continue;
    }

    if (
      group.length < 1 ||
      group.length > 4 ||
      !/^[a-f0-9]+$/i.test(group)
    ) {
      return false;
    }

    groupCount += 1;
  }

  if (hasCompression) {
    return groupCount < 8;
  }

  return groupCount === 8;
}

/**
 * Détermine si une IPv6 commence par un préfixe hexadécimal.
 */
function ipv6StartsWithPrefix(
  value: string,
  prefixPattern: RegExp,
): boolean {
  return prefixPattern.test(
    removeIpv6Zone(normalizeIpv6(value)),
  );
}

/**
 * Classification technique d'une IPv6.
 */
function classifyIpv6(
  value: string,
): Ipv6Classification {
  const normalized = removeIpv6Zone(
    normalizeIpv6(value),
  );

  const isLoopback = normalized === '::1';

  const isUnspecified = normalized === '::';

  const isLinkLocal = ipv6StartsWithPrefix(
    normalized,
    /^fe[89ab][0-9a-f]:/i,
  );

  const isPrivate = ipv6StartsWithPrefix(
    normalized,
    /^f[cd][0-9a-f]{2}:/i,
  );

  const isMulticast = ipv6StartsWithPrefix(
    normalized,
    /^ff[0-9a-f]{2}:/i,
  );

  const isDocumentation = ipv6StartsWithPrefix(
    normalized,
    /^2001:0?db8:/i,
  );

  if (isLoopback) {
    return {
      status: 'loopback',
      private: false,
      loopback: true,
      linkLocal: false,
      reserved: false,
    };
  }

  if (isLinkLocal) {
    return {
      status: 'link-local',
      private: false,
      loopback: false,
      linkLocal: true,
      reserved: false,
    };
  }

  if (isPrivate) {
    return {
      status: 'private',
      private: true,
      loopback: false,
      linkLocal: false,
      reserved: false,
    };
  }

  if (
    isUnspecified ||
    isMulticast ||
    isDocumentation
  ) {
    return {
      status: 'reserved',
      private: false,
      loopback: false,
      linkLocal: false,
      reserved: true,
    };
  }

  return {
    status: 'public',
    private: false,
    loopback: false,
    linkLocal: false,
    reserved: false,
  };
}

/**
 * Validation stricte d'une adresse IPv6.
 */
export function validateIpv6(
  value: string,
): IocValidationResult {
  const normalizedValue = normalizeIpv6(value);

  if (!isValidIpv6Syntax(normalizedValue)) {
    return {
      valid: false,
      type: 'IPv6',
      normalizedValue,
      status: 'unknown',
      metadata: {
        version: 6,
      },
      reason: 'Adresse IPv6 syntaxiquement invalide.',
    };
  }

  const classification = classifyIpv6(
    normalizedValue,
  );

  return {
    valid: true,
    type: 'IPv6',
    normalizedValue,
    status: classification.status,
    metadata: {
      version: 6,
      private: classification.private,
      loopback: classification.loopback,
      linkLocal: classification.linkLocal,
    },
  };
}

/**
 * Validation stricte d'un nom de domaine.
 */
export function validateDomain(
  value: string,
): IocValidationResult {
  const normalizedValue = normalizeDomain(value);

  if (
    normalizedValue.length < 4 ||
    normalizedValue.length > 253
  ) {
    return {
      valid: false,
      type: 'Domain',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        'La longueur du nom de domaine est invalide.',
    };
  }

  const labels = normalizedValue.split('.');

  if (labels.length < 2) {
    return {
      valid: false,
      type: 'Domain',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        'Le domaine doit contenir au moins un suffixe DNS.',
    };
  }

  if (
    labels.some(
      (label) => !DOMAIN_LABEL_PATTERN.test(label),
    )
  ) {
    return {
      valid: false,
      type: 'Domain',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        'Un ou plusieurs labels DNS sont invalides.',
    };
  }

  const topLevelDomain = labels.at(-1);

  if (
    !topLevelDomain ||
    !TOP_LEVEL_DOMAIN_PATTERN.test(topLevelDomain)
  ) {
    return {
      valid: false,
      type: 'Domain',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason: 'Le suffixe DNS est invalide.',
    };
  }

  return {
    valid: true,
    type: 'Domain',
    normalizedValue,
    status: 'public',
    metadata: {},
  };
}

/**
 * Validation d'une adresse email.
 */
export function validateEmail(
  value: string,
): IocValidationResult {
  const normalizedValue = normalizeEmail(value);

  if (
    normalizedValue.length < 3 ||
    normalizedValue.length > 254
  ) {
    return {
      valid: false,
      type: 'Email',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        "La longueur de l'adresse email est invalide.",
    };
  }

  const separatorIndex =
    normalizedValue.lastIndexOf('@');

  if (
    separatorIndex <= 0 ||
    separatorIndex === normalizedValue.length - 1
  ) {
    return {
      valid: false,
      type: 'Email',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        "L'adresse email ne contient pas une séparation valide.",
    };
  }

  const localPart = normalizedValue.slice(
    0,
    separatorIndex,
  );

  const domainPart = normalizedValue.slice(
    separatorIndex + 1,
  );

  if (
    localPart.length > 64 ||
    !EMAIL_LOCAL_PART_PATTERN.test(localPart) ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..')
  ) {
    return {
      valid: false,
      type: 'Email',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        "La partie locale de l'adresse email est invalide.",
    };
  }

  const domainValidation =
    validateDomain(domainPart);

  if (!domainValidation.valid) {
    return {
      valid: false,
      type: 'Email',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        "Le domaine de l'adresse email est invalide.",
    };
  }

  return {
    valid: true,
    type: 'Email',
    normalizedValue,
    status: 'public',
    metadata: {},
  };
}

/**
 * Validation d'une URL HTTP ou HTTPS.
 */
export function validateUrl(
  value: string,
): IocValidationResult {
  const normalizedValue = normalizeUrl(value);

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    return {
      valid: false,
      type: 'URL',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason: "L'URL ne peut pas être analysée.",
    };
  }

  if (
    parsedUrl.protocol !== 'http:' &&
    parsedUrl.protocol !== 'https:'
  ) {
    return {
      valid: false,
      type: 'URL',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        "Seules les URL HTTP et HTTPS sont acceptées.",
    };
  }

  if (!parsedUrl.hostname) {
    return {
      valid: false,
      type: 'URL',
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason: "L'URL ne contient pas d'hôte.",
    };
  }

  let hostnameStatus: IocStatus = 'unknown';
  let ipMetadata: IocMetadata = {};

  const ipv4Validation = validateIpv4(
    parsedUrl.hostname,
  );

  if (ipv4Validation.valid) {
    hostnameStatus = ipv4Validation.status;
    ipMetadata = ipv4Validation.metadata;
  } else {
    const ipv6Hostname = parsedUrl.hostname
      .replace(/^\[/, '')
      .replace(/\]$/, '');

    const ipv6Validation = validateIpv6(
      ipv6Hostname,
    );

    if (ipv6Validation.valid) {
      hostnameStatus = ipv6Validation.status;
      ipMetadata = ipv6Validation.metadata;
    } else {
      const domainValidation = validateDomain(
        parsedUrl.hostname,
      );

      if (!domainValidation.valid) {
        return {
          valid: false,
          type: 'URL',
          normalizedValue,
          status: 'unknown',
          metadata: {},
          reason:
            "Le nom d'hôte contenu dans l'URL est invalide.",
        };
      }

      hostnameStatus = domainValidation.status;
    }
  }

  const path = parsedUrl.pathname || '/';
  const lastSegment =
    path.split('/').filter(Boolean).at(-1) ?? '';

  const extensionMatch = lastSegment.match(
    /\.([a-z0-9]{1,12})$/i,
  );

  return {
    valid: true,
    type: 'URL',
    normalizedValue,
    status: hostnameStatus,
    metadata: {
      ...ipMetadata,
      hostname: parsedUrl.hostname,
      path,
      extension: extensionMatch?.[1]?.toLowerCase() ?? null,
      protocol:
        parsedUrl.protocol === 'https:'
          ? 'https:'
          : 'http:',
    },
  };
}

/**
 * Validation stricte d'un hash.
 */
export function validateHash(
  type: Extract<IocType, 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512'>,
  value: string,
): IocValidationResult {
  const normalizedValue = normalizeHash(value);
  const expectedLength = HASH_LENGTHS[type];

  if (normalizedValue.length !== expectedLength) {
    return {
      valid: false,
      type,
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        `Le hash ${type} doit contenir exactement ` +
        `${expectedLength} caractères hexadécimaux.`,
    };
  }

  if (!HEXADECIMAL_PATTERN.test(normalizedValue)) {
    return {
      valid: false,
      type,
      normalizedValue,
      status: 'unknown',
      metadata: {},
      reason:
        `Le hash ${type} contient des caractères non hexadécimaux.`,
    };
  }

  return {
    valid: true,
    type,
    normalizedValue,
    status: 'known',
    metadata: {},
  };
}

/**
 * Validation générique d'un IOC selon son type.
 */
export function validateIoc(
  type: IocType,
  value: string,
): IocValidationResult {
  const cleanedValue = cleanIocValue(value);

  if (!cleanedValue) {
    return {
      valid: false,
      type,
      normalizedValue: '',
      status: 'unknown',
      metadata: {},
      reason: "La valeur de l'IOC est vide.",
    };
  }

  switch (type) {
    case 'IPv4':
      return validateIpv4(cleanedValue);

    case 'IPv6':
      return validateIpv6(cleanedValue);

    case 'Domain':
      return validateDomain(cleanedValue);

    case 'URL':
      return validateUrl(cleanedValue);

    case 'Email':
      return validateEmail(cleanedValue);

    case 'MD5':
    case 'SHA-1':
    case 'SHA-256':
    case 'SHA-512':
      return validateHash(type, cleanedValue);

    default:
      return {
        valid: false,
        type,
        normalizedValue:
          normalizeIocValue(type, cleanedValue),
        status: 'unknown',
        metadata: {},
        reason:
          `Le type IOC "${type}" n'est pas pris en charge.`,
      };
  }
}

/**
 * Raccourci retournant uniquement le booléen de validation.
 */
export function isValidIoc(
  type: IocType,
  value: string,
): boolean {
  return validateIoc(type, value).valid;
}