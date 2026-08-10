export interface LegacyCyberGuessSituation {
	id: number;
	context: string[];
	question: string;
	answers: string[];
	correctIndex: number;
	verdict: string;
	explanation: string;
}

export const legacyCyberGuessSituations: LegacyCyberGuessSituation[] = [
	{
		id: 1,
		context: [
			'Il est vendredi, 17 h 58.',
			'Votre sac est fermé et votre cerveau a déjà quitté le bâtiment.',
			'Un message Teams apparaît : « Tu as deux minutes ? »',
		],
		question: 'Quelle est la durée réelle de ces « deux minutes » ?',
		answers: [
			'Deux minutes, montre en main',
			'Le temps d’un rapide partage d’écran',
			'Une unité temporelle non reconnue par le système international',
			'Jusqu’à lundi matin',
		],
		correctIndex: 2,
		verdict: 'Exact. Votre vendredi soir vient officiellement d’être annulé.',
		explanation:
			'Dans l’IT, « deux minutes » décrit généralement l’intention de départ, jamais la durée finale.',
	},
	{
		id: 2,
		context: [
			'Après trois semaines d’ateliers, deux comités et quarante-sept versions du schéma,',
			'l’architecture est enfin validée par toutes les personnes présentes.',
			'Une nouvelle invitation arrive pour demain matin.',
		],
		question: 'Qui demande le changement de dernière minute ?',
		answers: [
			'Le métier',
			'Le RSSI',
			'La personne absente depuis le début du projet',
			'Le stagiaire arrivé lundi',
		],
		correctIndex: 2,
		verdict: 'Exact. Cette personne avait justement « une petite remarque ».',
		explanation:
			'La présence aux ateliers réduit statistiquement la probabilité de demander une refonte complète la veille du déploiement.',
	},
	{
		id: 3,
		context: [
			'Un ticket vient d’être créé avec la priorité « CRITIQUE ».',
			'Vous interrompez immédiatement votre travail et appelez le demandeur.',
			'Après quatre sonneries, il décroche.',
		],
		question: 'Quelle est sa première phrase ?',
		answers: [
			'« Merci d’avoir rappelé aussi vite. »',
			'« Ah non, finalement ça peut attendre. »',
			'« Je vous transfère les logs. »',
			'« Le service est totalement indisponible. »',
		],
		correctIndex: 1,
		verdict: 'Exact. Le niveau CRITIQUE était visiblement décoratif.',
		explanation:
			'Le mot « critique » mesure parfois davantage l’impatience du demandeur que l’impact réel de l’incident.',
	},
	{
		id: 4,
		context: [
			'Vous ouvrez un firewall hérité d’un ancien projet.',
			'Une règle autorise ANY vers ANY, sur ANY, avec une description vide.',
			'La date de création est antérieure à l’arrivée de la moitié de l’équipe.',
		],
		question: 'Quelle est l’explication la plus probable ?',
		answers: [
			'C’était temporaire',
			'Le besoin était urgent',
			'La documentation se trouve sûrement quelque part',
			'Les trois réponses précédentes',
		],
		correctIndex: 3,
		verdict: 'Exact. Cette règle est temporaire depuis plusieurs années.',
		explanation:
			'Une règle temporaire devient souvent permanente dès que son auteur quitte le projet.',
	},
	{
		id: 5,
		context: [
			'Le développeur affirme que la fonctionnalité marche parfaitement sur son poste.',
			'Elle échoue pourtant sur tous les environnements partagés.',
			'Le bridge d’incident vient d’être ouvert.',
		],
		question: 'Quelle est la prochaine étape officielle ?',
		answers: [
			'Fermer le ticket',
			'Aller travailler directement sur son poste',
			'Reproduire méthodiquement le problème',
			'Accuser le réseau sans preuve complémentaire',
		],
		correctIndex: 3,
		verdict: 'Exact. Le réseau est coupable jusqu’à preuve de son innocence.',
		explanation:
			'Le réseau reste une hypothèse solide tant qu’aucune autre équipe n’accepte la responsabilité.',
	},
	{
		id: 6,
		context: [
			'Le chef de projet annonce qu’un changement est « très simple ».',
			'Il ne nécessite, selon lui, aucun atelier supplémentaire.',
			'Le planning tient actuellement sur une demi-slide.',
		],
		question: 'Combien de réunions seront finalement nécessaires ?',
		answers: [
			'Une seule',
			'Deux, avec le point de lancement',
			'Cinq maximum',
			'On arrêtera de compter avant la recette',
		],
		correctIndex: 3,
		verdict: 'Exact. Le mot « simple » vient encore de faire une victime.',
		explanation:
			'La simplicité déclarée en avant-vente n’est pas toujours conservée après contact avec la réalité.',
	},
	{
		id: 7,
		context: [
			'Un incident mobilise cinq équipes depuis deux heures.',
			'Les hypothèses se multiplient et le tableau blanc est désormais illisible.',
			'Une personne qui vient d’arriver pose une question très simple.',
		],
		question: 'Qui trouve finalement la solution ?',
		answers: [
			'Le support éditeur',
			'L’architecte principal',
			'La personne qui demande si quelqu’un a redémarré le service',
			'Le comité de crise',
		],
		correctIndex: 2,
		verdict: 'Exact. Deux heures d’expertise battues par un redémarrage.',
		explanation:
			'La complexité de l’investigation augmente parfois plus vite que celle de la cause réelle.',
	},
	{
		id: 8,
		context: [
			'Un commercial présente une fonctionnalité qui n’existe pas dans votre version.',
			'Devant le client, il précise avec assurance :',
			'« Ça marche déjà chez un autre client. »',
		],
		question: 'Que faut-il réellement comprendre ?',
		answers: [
			'La fonctionnalité est documentée',
			'La fonctionnalité est supportée',
			'Quelque part, dans un contexte inconnu, quelque chose d’approchant a fonctionné',
			'La mise en production est planifiée',
		],
		correctIndex: 2,
		verdict: 'Exact. Quelque part, quelque chose a probablement clignoté en vert.',
		explanation:
			'Le mot « déjà » ne précise ni la version, ni le périmètre, ni l’état actuel du client concerné.',
	},
	{
		id: 9,
		context: [
			'Le COPIL commence à 9 h 00.',
			'Après quarante-cinq minutes de slides, tous les indicateurs sont verts.',
			'Le sponsor prend enfin la parole.',
		],
		question: 'Quelle question va-t-il poser ?',
		answers: [
			'« Le budget est-il maîtrisé ? »',
			'« Quel est le prochain jalon ? »',
			'« Du coup… concrètement, ça sert à quoi ? »',
			'« Qui valide le compte-rendu ? »',
		],
		correctIndex: 2,
		verdict: 'Exact. Quarante-cinq slides et toujours aucune idée de ce qu’on vend.',
		explanation:
			'Plus le nombre de slides augmente, plus la probabilité de devoir réexpliquer l’objectif initial se rapproche de 100 %.',
	},
	{
		id: 10,
		context: [
			'Un correctif doit être déployé en production.',
			'Le changement est annoncé comme transparent et totalement maîtrisé.',
			'La procédure de retour arrière contient une seule ligne : « Restaurer si nécessaire ».',
		],
		question: 'Quand le premier problème apparaîtra-t-il ?',
		answers: [
			'Pendant les tests',
			'Juste après la validation',
			'Pendant la démonstration au directeur',
			'Il n’y aura aucun problème',
		],
		correctIndex: 2,
		verdict: 'Exact. L’incident avait réservé sa place pour la démonstration.',
		explanation:
			'Les incidents disposent d’un remarquable instinct pour choisir le moment où le plus grand nombre de personnes regarde.',
	},
	{
		id: 11,
		context: [
			'La documentation devait être finalisée après la mise en production.',
			'La mise en production a eu lieu il y a neuf mois.',
			'Un nouvel arrivant demande où se trouve le dossier d’exploitation.',
		],
		question: 'Quelle réponse obtient-il ?',
		answers: [
			'« Dans le référentiel documentaire. »',
			'« Demande à l’ancien prestataire. »',
			'« On a surtout documenté dans les tickets. »',
			'« Elle est en cours de validation. »',
		],
		correctIndex: 2,
		verdict: 'Exact. La documentation existe, mais sous forme de chasse au trésor.',
		explanation:
			'Une information répartie dans trente-sept tickets est techniquement documentée, mais uniquement au sens archéologique du terme.',
	},
	{
		id: 12,
		context: [
			'Le rapport d’audit contient une recommandation prioritaire.',
			'Le plan d’action indique : « À étudier ».',
			'Six mois plus tard, le statut n’a pas changé.',
		],
		question: 'Que signifie réellement « À étudier » ?',
		answers: [
			'Une analyse détaillée est en cours',
			'Un budget a été réservé',
			'La recommandation a été acceptée',
			'Le sujet dispose désormais d’un endroit calme où attendre',
		],
		correctIndex: 3,
		verdict: 'Exact. « À étudier » : le parking longue durée de la remédiation.',
		explanation:
			'« À étudier » est un état stable, compatible avec la plupart des échéances non contraignantes.',
	},
	{
		id: 13,
		context: [
			'Une alerte du SOC mentionne une activité PowerShell inhabituelle.',
			'Le compte concerné appartient à une équipe d’administration.',
			'Le ticket reçoit une réponse trente secondes plus tard.',
		],
		question: 'Quelle est cette réponse ?',
		answers: [
			'« Nous lançons une investigation complète. »',
			'« Activité légitime. »',
			'« Le compte va être désactivé. »',
			'« Merci de fournir les éléments de contexte. »',
		],
		correctIndex: 1,
		verdict: 'Exact. Trente secondes : nouveau record mondial d’investigation.',
		explanation:
			'La légitimité d’une commande augmente parfois proportionnellement au niveau d’administration du compte qui l’exécute.',
	},
	{
		id: 14,
		context: [
			'Le client demande une ouverture réseau urgente.',
			'La source est connue, mais la destination reste « à confirmer ».',
			'Le port demandé est indiqué comme « standard ».',
		],
		question: 'Quelle information manque encore ?',
		answers: [
			'La destination',
			'Le port',
			'La justification',
			'À peu près tout ce qui permettrait de créer la règle',
		],
		correctIndex: 3,
		verdict: 'Exact. Il ne manque plus que la source, la destination, le port et la raison.',
		explanation:
			'Le niveau d’urgence ne remplace malheureusement pas les informations techniques obligatoires.',
	},
	{
		id: 15,
		context: [
			'Le service est revenu après un redémarrage.',
			'Le ticket est fermé avec la mention « incident résolu ».',
			'Aucune cause racine n’a été identifiée.',
		],
		question: 'Quand l’incident reviendra-t-il ?',
		answers: [
			'Jamais',
			'Lors de la prochaine maintenance',
			'Quand tout le monde aura oublié le premier',
			'Après publication du rapport de cause racine',
		],
		correctIndex: 2,
		verdict: 'Exact. Le redémarrage a remis l’incident en attente de sa prochaine apparition.',
		explanation:
			'Un redémarrage supprime parfois le symptôme assez longtemps pour que l’incident puisse redevenir une surprise.',
	},
];
