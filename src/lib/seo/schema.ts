export const SITE_URL = 'https://marcmichon.co';
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SUITE_ID = `${SITE_URL}/labs/#suite`;

export type JsonLdPrimitive = string | number | boolean | null;

export interface JsonLdObject {
	[key: string]: JsonLdValue | undefined;
}

export type JsonLdValue =
	| JsonLdPrimitive
	| JsonLdObject
	| JsonLdValue[];

export type JsonLdSchema = JsonLdObject;

export interface BreadcrumbItem {
	name: string;
	url: string;
}

export interface ArticleSchemaInput {
	title: string;
	description: string;
	url: string;
	datePublished: string;
	dateModified?: string;
	image?: string;
	section?: string;
	keywords?: string[];
}

export interface SoftwareSchemaInput {
	name: string;
	description: string;
	url: string;
	applicationCategory?: string;
	operatingSystem?: string;
	image?: string;
	version?: string;
	features?: string[];
}

function absoluteUrl(value: string): string {
	return new URL(value, SITE_URL).toString();
}

export function personSchema(): JsonLdSchema {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		'@id': PERSON_ID,
		name: 'Marc Michon',
		url: SITE_URL,
		jobTitle: 'Ingénieur cybersécurité',
		description:
			'Ingénieur cybersécurité spécialisé en gestion des vulnérabilités, détection et réponse, Threat Intelligence et Security Engineering.',
		knowsAbout: [
			'Vulnerability Management',
			'Exposure Management',
			'Endpoint Detection and Response',
			'SIEM',
			'SOAR',
			'Threat Intelligence',
			'Security Engineering',
		],
	};
}

export function websiteSchema(): JsonLdSchema {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		url: SITE_URL,
		name: 'marcmichon.co',
		description:
			'Notes de terrain et outils de cybersécurité opérationnelle issus de situations réelles.',
		inLanguage: 'fr-FR',
		publisher: {
			'@id': PERSON_ID,
		},
	};
}

export function suiteSchema(): JsonLdSchema {
	return {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		'@id': SUITE_ID,
		url: `${SITE_URL}/labs/`,
		name: 'MM Security Intelligence Suite',
		description:
			'Suite d’outils de cybersécurité orientés analyse, investigation et aide à la décision.',
		inLanguage: 'fr-FR',
		isPartOf: {
			'@id': WEBSITE_ID,
		},
		author: {
			'@id': PERSON_ID,
		},
	};
}

export function articleSchema(input: ArticleSchemaInput): JsonLdSchema {
	const canonicalUrl = absoluteUrl(input.url);

	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		'@id': `${canonicalUrl}#article`,
		headline: input.title,
		description: input.description,
		url: canonicalUrl,
		mainEntityOfPage: canonicalUrl,
		datePublished: input.datePublished,
		dateModified: input.dateModified ?? input.datePublished,
		inLanguage: 'fr-FR',
		articleSection: input.section,
		keywords: input.keywords,
		image: input.image ? absoluteUrl(input.image) : undefined,
		author: {
			'@id': PERSON_ID,
		},
		publisher: {
			'@id': PERSON_ID,
		},
		isPartOf: {
			'@id': WEBSITE_ID,
		},
	};
}

export function softwareApplicationSchema(
	input: SoftwareSchemaInput,
): JsonLdSchema {
	const canonicalUrl = absoluteUrl(input.url);

	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		'@id': `${canonicalUrl}#software`,
		name: input.name,
		description: input.description,
		url: canonicalUrl,
		applicationCategory:
			input.applicationCategory ?? 'SecurityApplication',
		operatingSystem: input.operatingSystem ?? 'Web',
		softwareVersion: input.version,
		image: input.image ? absoluteUrl(input.image) : undefined,
		featureList: input.features,
		inLanguage: 'fr-FR',
		isAccessibleForFree: true,
		author: {
			'@id': PERSON_ID,
		},
		isPartOf: {
			'@id': SUITE_ID,
		},
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'EUR',
		},
	};
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdSchema {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.url),
		})),
	};
}

export function graphSchema(schemas: JsonLdSchema[]): JsonLdSchema {
	return {
		'@context': 'https://schema.org',
		'@graph': schemas.map(({ '@context': _context, ...schema }) => schema),
	};
}
