export type BullshitMode =
	| 'cyber'
	| 'rssi'
	| 'copil'
	| 'consultant'
	| 'cloud'
	| 'devops'
	| 'ia'
	| 'editeur';

export interface BullshitLexicon {
	label: string;
	description: string;
	intros: string[];
	subjects: string[];
	verbs: string[];
	objects: string[];
	purposes: string[];
	endings: string[];
	translations: string[];
}

const commonIntros = [
	'Dans le contexte actuel,',
	'Au regard des enjeux identifiés,',
	'Dans une logique d’amélioration continue,',
	'À ce stade de la trajectoire,',
	'Conformément aux orientations retenues,',
	'Dans le prolongement des travaux engagés,',
	'À périmètre constant,',
	'Dans une approche pragmatique,',
	'Dans le cadre du dispositif cible,',
	'En cohérence avec la feuille de route,',
	'Sur la base des arbitrages réalisés,',
	'Dans une dynamique transverse,',
	'À horizon moyen terme,',
	'Dans une logique de convergence,',
	'Au niveau de maturité actuel,',
	'Dans le respect du cadre existant,',
	'En capitalisant sur les acquis,',
	'Dans une approche orientée valeur,',
	'Dans une logique de bout en bout,',
	'Au regard des priorités métier,',
];

const commonVerbs = [
	'permet de consolider',
	'vise à renforcer',
	'contribue à structurer',
	'favorise',
	'capitalise sur',
	'adresse',
	'valorise',
	'industrialise',
	'pérennise',
	'sécurise',
	'accélère',
	'accompagne',
	'oriente',
	'alimente',
	'fiabilise',
	'cadre',
	'fédère',
	'optimise',
	'fluidifie',
	'formalise',
	'stabilise',
	'harmonise',
	'mutualise',
	'orchestre',
	'opérationnalise',
	'standardise',
	'priorise',
	'objectivise',
	'rationalise',
	'urbanise',
];

const commonPurposes = [
	'afin d’optimiser la valeur métier',
	'dans une logique d’amélioration continue',
	'tout en garantissant la résilience',
	'sans remettre en cause les équilibres existants',
	'au regard des enjeux identifiés',
	'selon les standards de gouvernance',
	'dans une approche progressive et pragmatique',
	'pour accompagner la transformation',
	'afin de sécuriser la trajectoire',
	'tout en préservant l’agilité opérationnelle',
	'avec un niveau de maîtrise adapté',
	'dans le respect des orientations stratégiques',
	'afin de favoriser l’adhésion des parties prenantes',
	'pour renforcer la cohérence globale',
	'avec une vision de bout en bout',
	'dans une logique de performance durable',
	'afin de soutenir les usages futurs',
	'tout en maintenant la continuité de service',
	'avec une approche centrée sur la valeur',
	'en cohérence avec les capacités disponibles',
];

const commonEndings = [
	'.',
	', sans générer de dette supplémentaire.',
	', sous réserve de validation des parties prenantes.',
	', avec un pilotage renforcé.',
	', selon un calendrier restant à consolider.',
	', dans le respect des contraintes actuelles.',
	', tout en laissant la porte ouverte aux évolutions futures.',
	', à condition d’aligner les niveaux de maturité.',
	', avec un suivi dans la durée.',
	', sous contrôle de la gouvernance.',
	', en fonction des arbitrages à venir.',
	', après validation en comité.',
];

const commonTranslations = [
	'Personne ne sait exactement ce que cela signifie.',
	'Le sujet sera probablement repris au prochain comité.',
	'La décision n’est pas prise, mais la phrase est très rassurante.',
	'On vient de déplacer le problème dans une slide.',
	'Le planning n’existe pas encore.',
	'Cela signifie généralement : pas maintenant.',
	'Le périmètre reste flou, mais le vocabulaire est solide.',
	'Une action a été créée. Son échéance est « à définir ».',
	'La réunion suivante devrait clarifier la réunion précédente.',
	'Le risque est sous contrôle, au sens narratif du terme.',
	'Quelqu’un vient probablement d’ajouter une colonne dans Excel.',
	'Le sujet avance horizontalement.',
];

const build = (
	label: string,
	description: string,
	subjects: string[],
	objects: string[],
): BullshitLexicon => ({
	label,
	description,
	intros: commonIntros,
	subjects,
	verbs: commonVerbs,
	objects,
	purposes: commonPurposes,
	endings: commonEndings,
	translations: commonTranslations,
});

export const bullshitLexicons: Record<BullshitMode, BullshitLexicon> = {
	cyber: build(
		'Cybersécurité',
		'Posture, résilience, menace et gouvernance : tous les mots sont là.',
		[
			'la posture globale de cybersécurité', 'la trajectoire de remédiation', 'la gouvernance des risques',
			'le dispositif de défense en profondeur', 'la chaîne de détection et de réponse', 'la surface d’exposition',
			'le socle de sécurité', 'la stratégie de réduction du risque', 'la capacité de détection',
			'le modèle de confiance', 'la cartographie des menaces', 'le référentiel de contrôle',
			'la maturité opérationnelle', 'la couverture du périmètre', 'la démarche de sécurisation',
			'la résilience cyber', 'le pilotage des vulnérabilités', 'la gestion des exceptions',
			'la stratégie de défense', 'la vision risque',
		],
		[
			'les mécanismes de protection existants', 'les capacités de détection transverse',
			'les synergies entre prévention et réponse', 'les processus de remédiation', 'les usages de sécurité',
			'la gouvernance des exceptions', 'les indicateurs de maîtrise', 'les contrôles compensatoires',
			'la priorisation des menaces', 'les flux de décision', 'la visibilité sur les actifs',
			'les capacités d’investigation', 'la gestion des risques émergents', 'les mécanismes de surveillance',
			'la cohérence des politiques', 'les leviers de réduction du risque',
			'la protection des environnements critiques', 'la maîtrise des dépendances',
			'les processus de traitement', 'la capacité d’anticipation',
		],
	),
	rssi: build('RSSI', 'Le langage officiel des risques maîtrisés et des arbitrages à venir.',
		['le niveau de risque résiduel','la feuille de route de sécurité','la stratégie de maîtrise des risques','le dispositif de gouvernance','la trajectoire de conformité','la politique de sécurité','le plan de traitement','la matrice des risques','la démarche d’homologation','le cadre de responsabilité','la gouvernance cyber','le pilotage des risques','la vision stratégique','le dispositif de contrôle','la trajectoire de maturité'],
		['les orientations validées','les risques prioritaires','les arbitrages métiers','les exigences réglementaires','les dispositifs compensatoires','les objectifs de maîtrise','la responsabilité des parties prenantes','les indicateurs de gouvernance','la communication exécutive','les plans d’action consolidés','les risques acceptés','les dépendances critiques','la capacité de décision','la trajectoire budgétaire','les engagements de conformité']),
	copil: build('COPIL', 'Tout est aligné. Rien n’est décidé.',
		['le pilotage du programme','la trajectoire projet','la feuille de route','le dispositif de gouvernance','le plan d’action consolidé','le suivi des jalons','la dynamique projet','la stratégie de delivery','le cadrage opérationnel','le macro-planning','la gouvernance transverse','le plan de convergence','le backlog priorisé','la trajectoire de déploiement','la capacité d’exécution'],
		['les arbitrages à venir','les dépendances du planning','les engagements des équipes','les actions en cours','les points de vigilance','la prise de décision','les jalons structurants','les contributeurs clés','les risques projet','les chantiers prioritaires','les sujets restant à instruire','les décisions du comité précédent','les actions sans propriétaire','les échéances à confirmer','les hypothèses de travail']),
	consultant: build('Consultant', 'Une méthodologie propriétaire pour expliquer que tout dépend du contexte.',
		['notre méthodologie propriétaire','le modèle opératoire cible','la proposition de valeur','la démarche d’accompagnement','le cadre de transformation','la vision à 360 degrés','le modèle de maturité','la trajectoire de convergence','le dispositif d’excellence opérationnelle','la grille d’analyse','la démarche de co-construction','le modèle de gouvernance','le framework de référence','la stratégie d’adoption','la feuille de route cible'],
		['les leviers de transformation','les synergies organisationnelles','les enjeux structurants','les capacités différenciantes','la création de valeur','les quick wins','les chantiers de fond','les dimensions clés','les facteurs de succès','les axes de progrès','les opportunités de convergence','les besoins des parties prenantes','les processus cibles','les pratiques de référence','les indicateurs de maturité']),
	cloud: build('Cloud', 'Dynamique, distribué, scalable — et probablement plus cher que prévu.',
		['l’architecture cloud-native','la stratégie multi-cloud','le modèle de landing zone','l’orchestration des workloads','la plateforme de services','la trajectoire de migration','le socle d’infrastructure','la gouvernance FinOps','le modèle de résilience','la stratégie d’élasticité','la couche d’abstraction','le catalogue de services','l’approche serverless','la plateforme distribuée','le plan de modernisation'],
		['les workloads distribués','les capacités d’élasticité','la portabilité des services','la résilience des applications','les mécanismes de provisionnement','les pipelines d’infrastructure','les usages cloud','la maîtrise des coûts','les dépendances fournisseurs','la disponibilité multi-région','les services managés','les capacités de reprise','la gouvernance des ressources','les patterns d’architecture','les mécanismes d’autoscaling']),
	devops: build('DevOps', 'Tout est automatisé, sauf la réunion qui explique pourquoi ça ne marche pas.',
		['la chaîne CI/CD','la stratégie GitOps','le pipeline de delivery','la plateforme d’observabilité','le modèle d’automatisation','la factory logicielle','la chaîne de valeur DevSecOps','le dispositif de déploiement','l’approche infrastructure as code','la plateforme de conteneurisation','le modèle de release','la stratégie de rollback','le socle Kubernetes','la gouvernance des pipelines','le dispositif de monitoring'],
		['les boucles de feedback','les déploiements continus','les mécanismes de rollback','la qualité du delivery','les contrôles automatisés','les pipelines applicatifs','les environnements éphémères','la traçabilité des changements','les pratiques de versioning','la fiabilité des releases','les capacités d’observabilité','les workflows de validation','la gestion des dépendances','les politiques as code','les cycles de mise en production']),
	ia: build('Intelligence artificielle', 'Cognitive, prédictive, générative et naturellement souveraine.',
		['notre intelligence artificielle générative','le moteur cognitif','la plateforme prédictive','le modèle d’apprentissage','l’orchestration algorithmique','la couche d’intelligence augmentée','le dispositif d’IA responsable','la stratégie data-driven','le modèle de recommandation','la chaîne de décision augmentée','le moteur d’analyse comportementale','la capacité d’apprentissage continu','le framework d’IA de confiance','la plateforme de raisonnement','la gouvernance des modèles'],
		['les signaux faibles','les capacités prédictives','la prise de décision augmentée','les modèles de connaissance','les usages à forte valeur','les interactions homme-machine','les capacités de contextualisation','les mécanismes d’apprentissage','la gouvernance des données','les recommandations dynamiques','les parcours utilisateurs','les processus cognitifs','la détection d’anomalies','la confiance algorithmique','les capacités d’explicabilité']),
	editeur: build('Éditeur', 'La plateforme révolutionnaire qui unifie tout, nativement.',
		['notre plateforme nouvelle génération','notre moteur propriétaire','la solution unifiée','notre approche innovante','la plateforme tout-en-un','le moteur de corrélation avancée','notre architecture de rupture','la solution cloud-native','notre framework technologique','la plateforme de confiance','notre écosystème intégré','la solution augmentée par l’IA','notre moteur de visibilité','la plateforme autonome','notre technologie différenciante'],
		['la visibilité de bout en bout','les opérations de sécurité','la détection en temps réel','la réduction du temps de réponse','les workflows des analystes','la maîtrise des risques','les capacités de remédiation','la protection des actifs','les investigations complexes','la posture globale','la prise de décision','les environnements hybrides','la productivité des équipes','la couverture des menaces','les opérations à grande échelle']),
};

export const bullshitModes = Object.entries(bullshitLexicons).map(([value, lexicon]) => ({
	value: value as BullshitMode,
	label: lexicon.label,
	description: lexicon.description,
}));
