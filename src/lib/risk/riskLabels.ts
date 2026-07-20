export const ASSET_LABELS: Record<string, string> = {
	workstation: 'Poste utilisateur',
	server: 'Serveur',
	'web-application': 'Application web',
	api: 'API',
	database: 'Base de données',
	'active-directory': 'Active Directory',
	cloud: 'Ressource Cloud',
	ot: 'Équipement OT',
};

export const EXPOSURE_LABELS: Record<string, string> = {
	internet: 'Internet',
	partner: 'Partenaire / Extranet',
	vpn: 'VPN',
	internal: 'Réseau interne',
	isolated: 'Isolé / Segmenté',
};

export const CRITICALITY_LABELS: Record<number, string> = {
	1: 'Faible',
	2: 'Modérée',
	3: 'Importante',
	4: 'Critique',
};

export function getAssetLabel(value: string): string {
	return ASSET_LABELS[value] ?? value;
}

export function getExposureLabel(value: string): string {
	return EXPOSURE_LABELS[value] ?? value;
}

export function getCriticalityLabel(value: number): string {
	return CRITICALITY_LABELS[value] ?? `${value}/4`;
}

export function yesNo(value: boolean): string {
	return value ? 'Oui' : 'Non';
}

export function normalizeRiskLevel(level: string): string {
	return level
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}