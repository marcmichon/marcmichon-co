export type OffToolStatus = 'available' | 'coming-soon' | 'external';

export interface OffTool {
	number: string;
	title: string;
	description: string;
	href: string;
	badge: string;
	status: OffToolStatus;
	accent: 'blue' | 'violet' | 'orange' | 'green' | 'red';
	external?: boolean;
}

export const offTools: OffTool[] = [
	{
		number: '001',
		title: 'Security Bullshit Generator',
		description: 'Chaque mot a du sens. La phrase, beaucoup moins.',
		href: '/off/security-bullshit-generator/',
		badge: 'OFFICIALLY USELESS',
		status: 'available',
		accent: 'blue',
	},
	{
		number: '002',
		title: 'Friday Deploy Predictor',
		description: 'Évalue objectivement tes chances de passer un week-end tranquille.',
		href: '/off/friday-deploy-predictor/',
		badge: 'OFFICIALLY UNSUPPORTED',
		status: 'available',
		accent: 'orange',
	},
	{
		number: '003',
		title: 'RSSI Translator',
		description: 'Transforme une phrase simple en formulation prête pour le prochain comité.',
		href: '/off/rssi-translator/',
		badge: 'COMMITTEE READY',
		status: 'available',
		accent: 'violet',
	},
	{
		number: '004',
		title: 'Cyber Guess',
		description: 'Des situations improbables. Des réponses malheureusement crédibles.',
		href: '/off/cyber-guess/',
		badge: 'HIGHLY QUESTIONABLE',
		status: 'available',
		accent: 'green',
	},
	{

	number: '005',
	title: 'Security Explanation Generator',
	description: 'Parce qu’il fallait bien une version officielle.',
	href: '/off/security-explanation-generator/',
	badge: 'OFFICIALLY PLAUSIBLE',
	status: 'available',
	accent: 'violet',
},

{
	number: '006',
	title: 'Build Your Incident',
	description: 'Construisez une catastrophe informatique en moins de dix secondes.',
	href: '/off/build-your-incident/',
	badge: 'CHAOS ENGINE',
	status: 'available',
	accent: 'red',
	external: false,
},

{
	number: '008',
	title: 'Firewall Rule Fortune Cookie',
	description: 'Parce que parfois, le firewall essaie juste de te parler.',
	href: '/off/firewall-rule-fortune-cookie/',
	badge: 'OFFICIALLY SPIRITUAL',
	status: 'available',
	accent: 'orange',
	external: false,
},

{
	number: '009',
	title: 'CVSS Bullshit Generator',
	description: 'Parce qu’un score sur 10 n’était visiblement pas assez anxiogène.',
	href: '/off/cvss-bullshit-generator/',
	badge: 'SCIENTIFICALLY QUESTIONABLE',
	status: 'available',
	accent: 'red',
	external: false,
},
	{
		number: 'ESCAPED',
		title: 'TOEA Framework',
		description: 'À l’origine, c’était une blague. Puis quelqu’un a réservé un nom de domaine.',
		href: '/off/toea-framework/',
		badge: 'ESCAPED',
		status: 'external',
		accent: 'red',
		external: false,
	},
];
