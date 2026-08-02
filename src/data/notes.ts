export type NoteCollectionId =
	| 'security-platform-engineering'
	| 'vulnerability-management'
	| 'endpoint-security';

export interface NoteCollection {
	id: NoteCollectionId;
	name: string;
	shortName: string;
	description: string;
	longDescription: string;
	image: string;
	className: string;
}

export interface TerrainNote {
	id: string;
	href: string;
	title: string;
	description: string;
	readTime: string;
	date: string;
	collectionId: NoteCollectionId;
}

export const collections: NoteCollection[] = [
	{
		id: 'security-platform-engineering',
		name: 'Security Platform Engineering',
		shortName: 'Platform Engineering',
		description:
			'Réflexions sur la conception, l’évolution et la pérennité des plateformes de cybersécurité après leur déploiement.',
		longDescription:
			'Cette collection rassemble les Notes de Terrain consacrées à la vie des plateformes de cybersécurité : leur intégration, leur gouvernance, leur évolution, leur dette technique et leur capacité à rester alignées avec le système d’information.',
		image: '/Images/plateforme-figee.png',
		className: 'category-engineering',
	},
	{
		id: 'vulnerability-management',
		name: 'Vulnerability Management',
		shortName: 'Vulnerability Management',
		description:
			'Retours d’expérience sur la visibilité, la priorisation, la remédiation et la gouvernance des vulnérabilités.',
		longDescription:
			'Cette collection explore les mécanismes qui font réellement réussir ou échouer un programme de Vulnerability Management : connaissance des actifs, qualité du contexte, priorisation, ownership, remédiation et pilotage dans la durée.',
		image: '/Images/remediation-vm.png',
		className: 'category-vm',
	},
	{
		id: 'endpoint-security',
		name: 'Endpoint Security',
		shortName: 'Endpoint Security',
		description:
			'Ce que les consoles EDR montrent, ce qu’elles ne montrent pas et ce que le terrain finit toujours par révéler.',
		longDescription:
			'Cette collection regroupe les Notes de Terrain consacrées à la sécurité des endpoints, à la visibilité EDR, aux angles morts, aux exclusions et à l’écart parfois important entre un parc protégé sur le papier et une couverture réellement maîtrisée.',
		image: '/Images/edr-console-angles-morts.png',
		className: 'category-endpoint',
	},
];

export const notes: TerrainNote[] = [
	{
		id: 'NT-011',
		href: '/articles/plateformes-figees-apres-deploiement',
		title: 'Les plateformes qui se figent après leur déploiement',
		description:
			'Le projet d’intégration est terminé. Le projet de la plateforme, lui, ne fait que commencer.',
		readTime: '7 min',
		date: 'Août 2026',
		collectionId: 'security-platform-engineering',
	},
	{
		id: 'NT-010',
		href: '/articles/pourquoi-plateforme-securite-a-jour-techniquement-en-retard',
		title: 'Une plateforme à jour, mais techniquement en retard',
		description:
			'Une plateforme maintenue n’est pas forcément une plateforme qui continue d’évoluer.',
		readTime: '7 min',
		date: 'Juillet 2026',
		collectionId: 'security-platform-engineering',
	},
	{
		id: 'NT-009',
		href: '/articles/angles-morts-console-edr',
		title: 'Les angles morts d’une console EDR',
		description:
			'Pourquoi une console au vert ne garantit pas que votre niveau de sécurité est réellement bon.',
		readTime: '7 min',
		date: 'Juillet 2026',
		collectionId: 'endpoint-security',
	},
	{
		id: 'NT-008',
		href: '/articles/exclusions-edr-risque-silencieux',
		title: 'Les exclusions : le risque silencieux des plateformes EDR',
		description:
			'Indispensables au fonctionnement de certaines applications, elles deviennent parfois un angle mort durable.',
		readTime: '4 min',
		date: 'Juillet 2026',
		collectionId: 'endpoint-security',
	},
	{
		id: 'NT-007',
		href: '/articles/ce-que-votre-edr-ne-voit-pas',
		title: 'Votre EDR voit-il vraiment tout ?',
		description:
			'Déployer un EDR est essentiel. Encore faut-il identifier les équipements qui échappent à sa visibilité.',
		readTime: '3 min',
		date: 'Juin 2026',
		collectionId: 'endpoint-security',
	},
	{
		id: 'NT-006',
		href: '/articles/endpoint-protege-endpoint-securise',
		title: 'Pourquoi un endpoint protégé n’est pas forcément un endpoint sécurisé',
		description:
			'Un EDR protège un poste. Il ne garantit pas, à lui seul, que celui-ci soit réellement sécurisé.',
		readTime: '3 min',
		date: 'Juin 2026',
		collectionId: 'endpoint-security',
	},
	{
		id: 'NT-005',
		href: '/articles/programmes-vm-echec-scan',
		title: 'Pourquoi les programmes VM échouent rarement à cause du moteur de scan',
		description:
			'Le vrai problème se situe souvent ailleurs : gouvernance, processus et remédiation.',
		readTime: '3 min',
		date: 'Juin 2026',
		collectionId: 'vulnerability-management',
	},
	{
		id: 'NT-004',
		href: '/articles/assets-inconnus-visibilite',
		title: 'Pourquoi les assets inconnus détruisent votre visibilité sécurité',
		description: 'On ne protège pas ce que l’on ne connaît pas.',
		readTime: '4 min',
		date: 'Juin 2026',
		collectionId: 'vulnerability-management',
	},
	{
		id: 'NT-003',
		href: '/articles/tagging-vulnerability-management',
		title: 'Le tagging est le pilier oublié du Vulnerability Management',
		description:
			'Sans contexte métier, ownership et structuration, une plateforme VM produit des données mais peu de décisions.',
		readTime: '6 min',
		date: 'Juin 2026',
		collectionId: 'vulnerability-management',
	},
	{
		id: 'NT-002',
		href: '/articles/remediation-maillon-faible-vulnerability-management',
		title: 'Pourquoi la remédiation est souvent le maillon faible du Vulnerability Management',
		description:
			'Détecter une vulnérabilité est rarement le problème. La corriger et la suivre jusqu’à sa résolution l’est davantage.',
		readTime: '9 min',
		date: 'Juin 2026',
		collectionId: 'vulnerability-management',
	},
	{
		id: 'NT-001',
		href: '/articles/vulnerabilite-critique-risque',
		title: 'Une vulnérabilité critique détectée n’a jamais réduit le risque',
		description: 'Détecter n’est que la première étape.',
		readTime: '5 min',
		date: 'Juin 2026',
		collectionId: 'vulnerability-management',
	},
];

export function getCollection(id: string): NoteCollection | undefined {
	return collections.find((collection) => collection.id === id);
}

export function getNotesByCollection(id: NoteCollectionId): TerrainNote[] {
	return notes.filter((note) => note.collectionId === id);
}

export function getLatestNotes(limit = 6): TerrainNote[] {
	return notes.slice(0, limit);
}
