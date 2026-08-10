/**
 * Cyber Guess — Sprints 01 + 02 + 03
 * CG-0001 à CG-0090
 *
 * Gameplay :
 * - aucun mauvais choix ;
 * - chaque réflexe révèle son propre commentaire EN OFF ;
 * - les cas et les réponses sont tirés aléatoirement par la page.
 */

export type CyberGuessCategory =
	| 'support'
	| 'utilisateur'
	| 'mfa'
	| 'soc'
	| 'firewall'
	| 'reseau'
	| 'architecture'
	| 'integration'
	| 'projet'
	| 'reunion'
	| 'cafe'
	| 'quotidien-it';

export interface CyberGuessChoice {
	text: string;
	feedback: string;
}

export interface CyberGuessSituation {
	id: string;
	category: CyberGuessCategory;
	context: string[];
	question: string;
	choices: CyberGuessChoice[];
}


export const cyberGuessSituations: CyberGuessSituation[] = [
	{
		id: "CG-0001",
		category: "support",
		context: [
			"Tu ouvres un ticket marqué « URGENT ». L’objet annonce simplement que « ça ne fonctionne pas ».",
			"Dans la description, une seule ligne t’attend : « Bonjour. »",
			"Tu restes quelques secondes devant l’écran, comme si une deuxième phrase pouvait apparaître toute seule.",
		],
		question: "À cet instant précis, ton premier réflexe est…",
		choices: [
			{
				text: "Relire le ticket une deuxième fois.",
				feedback: "On ne sait jamais. Des fois que le problème apparaisse entre deux lectures.",
			},
			{
				text: "Descendre la molette alors qu’il n’y a déjà plus rien à lire.",
				feedback: "Réflexe purement mécanique. Le cerveau refuse encore d’accepter la réalité.",
			},
			{
				text: "Regarder s’il n’y a pas une pièce jointe oubliée.",
				feedback: "L’espoir est une belle qualité. En support, il dure environ trois secondes.",
			},
			{
				text: "Soupirer avant même de cliquer sur « Répondre ».",
				feedback: "Ton cerveau vient de comprendre qu’il va devoir mener une enquête à partir du mot « Bonjour ».",
			},
		],
	},
	{
		id: "CG-0002",
		category: "mfa",
		context: [
			"Tu viens de changer de téléphone et la migration s’est déroulée presque trop facilement.",
			"Outlook, Teams, le VPN et le gestionnaire de mots de passe fonctionnent déjà.",
			"Tu ouvres enfin l’application d’authentification. Elle est complètement vide.",
		],
		question: "Pendant la demi-seconde qui suit…",
		choices: [
			{
				text: "Tu vérifies trois fois que tu as ouvert la bonne application.",
				feedback: "Les deux premières vérifications ne servent à rien. La troisième non plus.",
			},
			{
				text: "Tu essaies de te souvenir si la synchronisation était activée.",
				feedback: "Le cerveau adore poser des questions dont il connaît déjà la réponse.",
			},
			{
				text: "Tu commences à lister mentalement les comptes à réenrôler.",
				feedback: "La liste continue généralement bien après que l’écran s’est verrouillé.",
			},
			{
				text: "Tu regrettes une décision prise six mois plus tôt.",
				feedback: "Étrangement, le passé devient toujours très clair dans ces moments-là.",
			},
		],
	},
	{
		id: "CG-0003",
		category: "soc",
		context: [
			"Il est 03 h 14 lorsqu’une alerte critique te réveille.",
			"Tu ouvres les détails en espérant presque qu’il se passe enfin quelque chose d’intéressant.",
			"Deux minutes plus tard, tu reconnais le même faux positif que les vingt-sept fois précédentes.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Regarder si quelqu’un l’a déjà prise.",
				feedback: "Avec un peu de chance, un collègue insomniaque vient de te sauver cinq minutes.",
			},
			{
				text: "Relire le nom de la règle.",
				feedback: "On ne sait jamais. Elle a peut-être décidé de devenir pertinente cette nuit.",
			},
			{
				text: "Soupirer avant même d’ouvrir les événements.",
				feedback: "Le cerveau optimise les performances en anticipant la déception.",
			},
			{
				text: "Regarder combien d’alertes attendent derrière.",
				feedback: "Le vrai stress n’est presque jamais la première alerte.",
			},
		],
	},
	{
		id: "CG-0004",
		category: "firewall",
		context: [
			"Le projet démarre alors que la liste des flux n’est toujours pas complètement connue.",
			"Le chef de projet te demande très calmement si l’on peut ouvrir en ANY « le temps des tests ».",
			"Autour de la table, plusieurs personnes hochent déjà la tête.",
		],
		question: "La petite voix dans ta tête…",
		choices: [
			{
				text: "Entend surtout les mots « le temps ».",
				feedback: "Ils vieillissent souvent beaucoup mieux que les projets.",
			},
			{
				text: "Imagine déjà la règle dans trois ans.",
				feedback: "Elle aussi. Avec sa description « TEMPORAIRE » toujours intacte.",
			},
			{
				text: "Cherche qui devra nettoyer après.",
				feedback: "Étrangement, ce n’est presque jamais la personne qui demande l’ouverture.",
			},
			{
				text: "Commence à préparer une réponse diplomatique.",
				feedback: "« Non » est très court. Tout le travail consiste à lui ajouter suffisamment de contexte.",
			},
		],
	},
	{
		id: "CG-0005",
		category: "cafe",
		context: [
			"Tu arrives devant la machine à café pendant que deux collègues parlent à voix basse.",
			"Tu n’entends que la fin d’une phrase : « …et finalement, c’est passé en production. »",
			"Quand ils te voient arriver, la conversation s’arrête net.",
		],
		question: "Sans même t’en rendre compte…",
		choices: [
			{
				text: "Tu ralentis légèrement la préparation de ton café.",
				feedback: "Technique d’écoute passive très répandue dans les DSI.",
			},
			{
				text: "Tu espères que personne ne parle de ton projet.",
				feedback: "Réflexe parfaitement irrationnel. Donc parfaitement humain.",
			},
			{
				text: "Tu attends discrètement la phrase suivante.",
				feedback: "La curiosité technique est un sport à risque.",
			},
			{
				text: "Tu décides qu’un deuxième café ne serait pas absurde.",
				feedback: "Le café n’apporte aucune réponse. Il permet simplement de rester assez longtemps.",
			},
		],
	},
	{
		id: "CG-0006",
		category: "utilisateur",
		context: [
			"Tu arrives devant le poste après un appel plutôt rassurant : l’utilisateur n’a « touché à rien ».",
			"Au moment où tu t’assois, il ajoute toutefois qu’il a fait « un petit truc » juste avant la panne.",
			"Son regard te confirme que la vraie histoire commence maintenant.",
		],
		question: "À ce moment précis…",
		choices: [
			{
				text: "Tu sais que le « petit truc » va devenir le personnage principal.",
				feedback: "L’adjectif « petit » est souvent très ambitieux.",
			},
			{
				text: "Tu oublies immédiatement la première phrase.",
				feedback: "La seconde vient de prendre toute la place dans l’investigation.",
			},
			{
				text: "Tu souris avant de poser la question suivante.",
				feedback: "Jamais trop visiblement. Il existe une diplomatie du support.",
			},
			{
				text: "Tu reprends l’histoire depuis le début.",
				feedback: "Tout ce qui précédait n’était finalement que le générique.",
			},
		],
	},
	{
		id: "CG-0007",
		category: "quotidien-it",
		context: [
			"Il est 08 h 58 et ta réunion commence dans moins de deux minutes.",
			"Tu branches ton casque, ouvres Teams et lances le VPN.",
			"Le bouton reste bloqué sur « Connexion… » pendant que l’horloge, elle, continue parfaitement de fonctionner.",
		],
		question: "Pendant ces quelques secondes…",
		choices: [
			{
				text: "Tu recliques sur « Connecter ».",
				feedback: "Comme si le premier clic avait simplement besoin d’encouragement.",
			},
			{
				text: "Tu regardes l’icône réseau.",
				feedback: "Elle n’a rien demandé, mais elle devient immédiatement suspecte.",
			},
			{
				text: "Tu prépares déjà ton message de retard.",
				feedback: "Le cerveau construit le plan B avant d’avoir vérifié le plan A.",
			},
			{
				text: "Tu fixes la barre de progression.",
				feedback: "On sait tous que ça ne l’aide pas. On le fait quand même.",
			},
		],
	},
	{
		id: "CG-0008",
		category: "integration",
		context: [
			"L’intégration fonctionnait encore parfaitement la veille.",
			"Ce matin, tous les appels API retournent une erreur et les vérifications habituelles ne donnent rien.",
			"Après vingt minutes, quelqu’un demande d’une petite voix quand expire le certificat.",
		],
		question: "Avant même d’ouvrir le navigateur…",
		choices: [
			{
				text: "Tu connais déjà la réponse sans vouloir y croire.",
				feedback: "Le calendrier vient soudain de devenir un outil de diagnostic.",
			},
			{
				text: "Tu espères que la date affichée ne sera pas celle d’hier.",
				feedback: "L’espoir technique peut survivre plusieurs secondes sans aucune donnée.",
			},
			{
				text: "Tu regardes si quelqu’un a reçu une alerte.",
				feedback: "Il y en avait probablement une. Dans une boîte mail que personne ne consulte.",
			},
			{
				text: "Tu cherches qui possède encore les accès au renouvellement.",
				feedback: "Le certificat est expiré. La chasse au propriétaire vient seulement de commencer.",
			},
		],
	},
	{
		id: "CG-0009",
		category: "soc",
		context: [
			"Une alerte remonte une commande PowerShell inhabituelle exécutée avec un compte d’administration.",
			"Tu demandes un peu de contexte avant de poursuivre l’investigation.",
			"Trente secondes plus tard, la réponse tombe : « Activité légitime. »",
		],
		question: "Ton réflexe suivant est de…",
		choices: [
			{
				text: "Relire l’horodatage de la réponse.",
				feedback: "Trente secondes : nouveau record mondial d’investigation complète.",
			},
			{
				text: "Chercher quand même la commande exacte.",
				feedback: "La confiance n’exclut pas le copier-coller dans un moteur de recherche interne.",
			},
			{
				text: "Vérifier si le compte est bien celui annoncé.",
				feedback: "« C’est un compte admin » reste un contexte. Pas une preuve.",
			},
			{
				text: "Ajouter ce scénario à ta liste des classiques.",
				feedback: "Chaque SOC possède une collection de réponses reçues beaucoup trop vite.",
			},
		],
	},
	{
		id: "CG-0010",
		category: "reunion",
		context: [
			"La réunion était prévue de 14 h à 15 h et touche enfin à sa fin.",
			"À 14 h 58, les ordinateurs commencent doucement à se refermer.",
			"C’est précisément à ce moment-là que quelqu’un annonce avoir « juste un dernier point ».",
		],
		question: "Sans même t’en rendre compte…",
		choices: [
			{
				text: "Tu regardes l’heure une deuxième fois.",
				feedback: "Comme si elle allait afficher une autre vérité cette fois.",
			},
			{
				text: "Tu penses immédiatement à ton rendez-vous suivant.",
				feedback: "Il vient de perdre quelques minutes d’espérance de vie.",
			},
			{
				text: "Tu regardes qui commence déjà à fermer son PC.",
				feedback: "Le premier qui range devient instantanément un leader d’opinion.",
			},
			{
				text: "Tu traduis « dernier point » par « on repart ».",
				feedback: "C’est une expression. Comme « ça prendra cinq minutes ».",
			},
		],
	},
	{
		id: "CG-0011",
		category: "utilisateur",
		context: [
			"Tu viens de terminer l’explication sur la réinitialisation du mot de passe.",
			"L’utilisateur a tout suivi avec sérieux et semble avoir parfaitement compris.",
			"Au moment de valider, il te demande s’il peut simplement reprendre l’ancien.",
		],
		question: "Ton premier réflexe…",
		choices: [
			{
				text: "Tu souris avant de répondre.",
				feedback: "Tu sens que cette conversation va durer un peu plus longtemps que prévu.",
			},
			{
				text: "Tu regardes le plafond une demi-seconde.",
				feedback: "Le cerveau cherche parfois la diplomatie au plafond.",
			},
			{
				text: "Tu reformules déjà ta réponse.",
				feedback: "Tu sais que le premier « non » ne suffira probablement pas.",
			},
			{
				text: "Tu te demandes combien de fois on t’a déjà posé cette question.",
				feedback: "Le compteur n’existe plus. C’est plus simple.",
			},
		],
	},
	{
		id: "CG-0012",
		category: "firewall",
		context: [
			"Tu lances un commit firewall après une modification pourtant minuscule.",
			"La barre de progression avance, s’arrête, repart, puis semble hésiter une nouvelle fois.",
			"Tout le monde attend pendant que tu évites soigneusement de toucher à quoi que ce soit.",
		],
		question: "Sans t’en rendre compte…",
		choices: [
			{
				text: "Tu fixes la barre de progression.",
				feedback: "Comme si elle pouvait ressentir la pression.",
			},
			{
				text: "Tu regardes discrètement l’heure.",
				feedback: "On mesure rarement un commit en secondes. Plutôt en patience.",
			},
			{
				text: "Tu évites même de déplacer la souris.",
				feedback: "Le syndrome du « si je clique, je casse tout ».",
			},
			{
				text: "Tu ouvres déjà un autre onglet.",
				feedback: "Autant rentabiliser l’attente.",
			},
		],
	},
	{
		id: "CG-0013",
		category: "soc",
		context: [
			"Une alerte remonte un script PowerShell classé comme suspect.",
			"Le fichier s’appelle simplement test.ps1 et provient d’un poste d’administration.",
			"Personne ne semble trouver ce nom particulièrement inquiétant.",
		],
		question: "Ton cerveau…",
		choices: [
			{
				text: "Ne croit pas une seconde au mot « test ».",
				feedback: "En cybersécurité, certains noms inspirent immédiatement la méfiance.",
			},
			{
				text: "Cherche directement qui l’a lancé.",
				feedback: "Le « quoi » attendra. Le « qui » est souvent plus bavard.",
			},
			{
				text: "Ouvre les événements associés.",
				feedback: "Les logs racontent généralement une histoire plus complète.",
			},
			{
				text: "Prépare déjà un café.",
				feedback: "Par expérience, PowerShell aime rarement les explications courtes.",
			},
		],
	},
	{
		id: "CG-0014",
		category: "projet",
		context: [
			"Le COPIL touche à sa fin et les premiers écrans commencent à se verrouiller.",
			"Le client reprend alors la parole avec un grand sourire.",
			"Il annonce qu’il reste seulement « une toute petite demande supplémentaire ».",
		],
		question: "Tu sais déjà que…",
		choices: [
			{
				text: "Le mot « petite » va être très subjectif.",
				feedback: "En projet, les adjectifs vivent leur propre vie.",
			},
			{
				text: "Quelqu’un va dire que ce ne devrait pas être compliqué.",
				feedback: "Cette phrase est rarement suivie de bonnes nouvelles.",
			},
			{
				text: "Tu vas regarder le chef de projet.",
				feedback: "Les expressions du visage font parfois gagner beaucoup de temps.",
			},
			{
				text: "Tu ouvres déjà mentalement le planning.",
				feedback: "Il vient probablement de perdre quelques couleurs.",
			},
		],
	},
	{
		id: "CG-0015",
		category: "soc",
		context: [
			"Tu lances une recherche Splunk que tu connais presque par cœur.",
			"L’écran reste vide malgré un premier ajustement du filtre.",
			"Tu relances exactement la même requête, comme si Splunk pouvait finir par changer d’avis.",
		],
		question: "Le premier réflexe…",
		choices: [
			{
				text: "Vérifier la plage horaire.",
				feedback: "Éternelle suspecte. Et parfois vraiment coupable.",
			},
			{
				text: "Vérifier l’index.",
				feedback: "Il y en a toujours un qui aime se faire oublier.",
			},
			{
				text: "Relancer encore une fois la recherche.",
				feedback: "L’optimisme existe aussi chez les analystes.",
			},
			{
				text: "Te demander si les logs arrivent vraiment.",
				feedback: "Sans logs, un SIEM devient très silencieux.",
			},
		],
	},
	{
		id: "CG-0016",
		category: "reunion",
		context: [
			"Quelqu’un parle depuis une trentaine de secondes pendant une réunion Teams.",
			"Personne ne réagit et la présentation continue comme si tout était normal.",
			"Une voix finit par l’interrompre : « Tu es en mute. »",
		],
		question: "Pendant cette scène…",
		choices: [
			{
				text: "Tu souris discrètement.",
				feedback: "Les classiques restent des classiques.",
			},
			{
				text: "Tu regardes automatiquement ton propre micro.",
				feedback: "Par solidarité… ou par inquiétude.",
			},
			{
				text: "Tu attends qu’il recommence toute sa phrase.",
				feedback: "Parce qu’il va recommencer toute sa phrase.",
			},
			{
				text: "Tu te demandes pourquoi personne ne l’a interrompu plus tôt.",
				feedback: "Il existe toujours un temps de latence social.",
			},
		],
	},
	{
		id: "CG-0017",
		category: "architecture",
		context: [
			"La discussion sur l’architecture cible commence à s’enliser.",
			"Pour avancer, quelqu’un propose un workaround « en attendant ».",
			"Autour de la table, tout le monde semble soulagé d’avoir trouvé une solution.",
		],
		question: "Tu comprends immédiatement que…",
		choices: [
			{
				text: "Le workaround va durer.",
				feedback: "Certains provisoires ont une carrière remarquable.",
			},
			{
				text: "Il finira peut-être dans la documentation.",
				feedback: "Enfin… s’il y a une documentation.",
			},
			{
				text: "Quelqu’un héritera du sujet.",
				feedback: "Le futur a souvent bon dos.",
			},
			{
				text: "Tu viens d’entendre le début d’une dette technique.",
				feedback: "Elle est encore petite. Pour l’instant.",
			},
		],
	},
	{
		id: "CG-0018",
		category: "cafe",
		context: [
			"Tu arrives à la machine à café encore à moitié concentré sur ton sujet.",
			"Un collègue te regarde et lance simplement : « Alors… t’as vu ? »",
			"Il ne précise rien, comme si toute la DSI parlait forcément de la même chose.",
		],
		question: "Ton cerveau…",
		choices: [
			{
				text: "Passe en revue les dix derniers incidents.",
				feedback: "Le cerveau ouvre automatiquement son tableau de bord interne.",
			},
			{
				text: "Espère que ça ne concerne pas ton périmètre.",
				feedback: "Petit réflexe de conservation tout à fait normal.",
			},
			{
				text: "Répond « Lequel ? » sans réfléchir.",
				feedback: "Question de survie en environnement informatique.",
			},
			{
				text: "Comprend que le café va refroidir.",
				feedback: "Certaines conversations commencent avant la première gorgée.",
			},
		],
	},
	{
		id: "CG-0019",
		category: "support",
		context: [
			"Le ticket arrive finalement dans ta file N3 après avoir circulé entre plusieurs équipes.",
			"Tu parcours huit commentaires, trois changements d’assignation et deux relances.",
			"Personne n’a encore posé la moindre question technique.",
		],
		question: "Avant même d’écrire un mot…",
		choices: [
			{
				text: "Tu remontes directement au premier message.",
				feedback: "L’histoire commence rarement à la page huit.",
			},
			{
				text: "Tu cherches si quelqu’un a déjà posé la bonne question.",
				feedback: "Étonnamment… non.",
			},
			{
				text: "Tu regardes depuis combien de jours le ticket existe.",
				feedback: "Par curiosité professionnelle… et un peu personnelle.",
			},
			{
				text: "Tu comprends pourquoi il est arrivé chez toi.",
				feedback: "Le ticket n’avait pas besoin d’un expert. Il avait besoin d’un début.",
			},
		],
	},
	{
		id: "CG-0020",
		category: "utilisateur",
		context: [
			"Le téléphone sonne au moment où tu retrouves enfin ta concentration.",
			"Une utilisatrice t’explique que son ordinateur est devenu très lent.",
			"Devant son écran, tu découvres Chrome avec quarante-sept onglets et une musique qui joue quelque part.",
		],
		question: "Ton premier réflexe…",
		choices: [
			{
				text: "Compter vaguement les onglets.",
				feedback: "À partir de trente, le cerveau passe en mode estimation.",
			},
			{
				text: "Chercher celui qui joue de la musique.",
				feedback: "Il est toujours plus loin que prévu.",
			},
			{
				text: "Regarder la mémoire utilisée.",
				feedback: "Les habitudes prennent parfois les commandes avant toi.",
			},
			{
				text: "Espérer qu’un redémarrage suffira.",
				feedback: "Le support vit aussi grâce à quelques miracles.",
			},
		],
	},
	{
		id: "CG-0021",
		category: "support",
		context: [
			"Tu cherches un utilisateur dans l’annuaire sans obtenir le moindre résultat.",
			"Après plusieurs filtres et deux recherches identiques, tu remarques enfin une lettre en trop dans son prénom.",
			"Pendant tout ce temps, tu avais déjà commencé à soupçonner Active Directory.",
		],
		question: "Pendant ces deux minutes…",
		choices: [
			{
				text: "Tu as commencé à douter de l’annuaire.",
				feedback: "L’annuaire n’y était pourtant pour rien.",
			},
			{
				text: "Tu t’es demandé si le compte existait encore.",
				feedback: "Le cerveau explore toutes les pistes… sauf l’orthographe.",
			},
			{
				text: "Tu as changé plusieurs filtres.",
				feedback: "Quitte à se tromper, autant varier les méthodes.",
			},
			{
				text: "Tu as relancé la même recherche.",
				feedback: "Parfois, on insiste juste un peu.",
			},
		],
	},
	{
		id: "CG-0022",
		category: "projet",
		context: [
			"Tu présentes un risque que tu as pris soin de documenter et d’expliquer simplement.",
			"À la fin de ton intervention, une personne demande quelle est sa probabilité exacte.",
			"Tu comprends que les dix prochaines minutes vont surtout servir à traduire le mot « possible ».",
		],
		question: "À cet instant…",
		choices: [
			{
				text: "Tu cherches une réponse compréhensible.",
				feedback: "Le plus compliqué n’est pas le risque. C’est sa traduction.",
			},
			{
				text: "Tu reformules immédiatement.",
				feedback: "Réflexe acquis après quelques COPIL.",
			},
			{
				text: "Tu regardes discrètement le sponsor du projet.",
				feedback: "Les réactions donnent souvent le ton.",
			},
			{
				text: "Tu sais que la discussion vient seulement de commencer.",
				feedback: "Les premières minutes n’étaient que l’échauffement.",
			},
		],
	},
	{
		id: "CG-0023",
		category: "soc",
		context: [
			"Tu poses ton café et ouvres la console EDR restée ouverte de la veille.",
			"Un poste apparaît Offline alors qu’il devait être parfaitement opérationnel.",
			"Tu actualises une première fois, puis une deuxième, avec exactement le même résultat.",
		],
		question: "Sans vraiment réfléchir, tu…",
		choices: [
			{
				text: "Regardes la date de la dernière connexion.",
				feedback: "Le cerveau cherche immédiatement une chronologie.",
			},
			{
				text: "Ouvres le ticket associé.",
				feedback: "Avec un peu de chance, quelqu’un est déjà dessus.",
			},
			{
				text: "Actualises une troisième fois.",
				feedback: "Cette fois, c’était plus par habitude que par conviction.",
			},
			{
				text: "Cherches si d’autres postes sont concernés.",
				feedback: "Un poste, c’est un incident. Dix postes, c’est une matinée.",
			},
		],
	},
	{
		id: "CG-0024",
		category: "support",
		context: [
			"Un mail marqué « URGENT » arrive pendant que tu termines enfin un autre sujet.",
			"Tu l’ouvres immédiatement et découvres une première phrase parfaitement calme : « Bonjour. »",
			"Tu continues à lire en cherchant encore où se cache exactement l’urgence.",
		],
		question: "Ton cerveau…",
		choices: [
			{
				text: "Cherche l’urgence dans le paragraphe suivant.",
				feedback: "Elle est peut-être simplement arrivée un peu plus tard.",
			},
			{
				text: "Regarde directement la dernière ligne.",
				feedback: "Le cerveau aime parfois les conclusions avant les explications.",
			},
			{
				text: "Vérifie l’heure d’envoi.",
				feedback: "Un « URGENT » de la veille n’a plus tout à fait la même saveur.",
			},
			{
				text: "Commence déjà à imaginer la réponse.",
				feedback: "Sans savoir encore quelle est la question.",
			},
		],
	},
	{
		id: "CG-0025",
		category: "cafe",
		context: [
			"Tu arrives devant la machine à café après une nuit plutôt tranquille.",
			"Un collègue te regarde et te demande simplement si tu as bien dormi.",
			"Son sourire suffit à t’apprendre qu’il s’est passé quelque chose pendant ton absence.",
		],
		question: "Ton premier réflexe…",
		choices: [
			{
				text: "Répondre « Pourquoi ? ».",
				feedback: "Question beaucoup plus dangereuse qu’elle n’en a l’air.",
			},
			{
				text: "Chercher mentalement ce qui a pu casser cette nuit.",
				feedback: "Le cerveau ouvre directement le tableau des incidents.",
			},
			{
				text: "Prendre ton café avant la suite.",
				feedback: "Certaines histoires méritent une préparation.",
			},
			{
				text: "Regarder discrètement les autres collègues.",
				feedback: "Leurs têtes racontent souvent déjà la moitié de l’histoire.",
			},
		],
	},
	{
		id: "CG-0026",
		category: "integration",
		context: [
			"Plusieurs utilisateurs signalent que l’application ne répond plus depuis le début de matinée.",
			"Les logs restent étonnamment calmes et le réseau semble parfaitement fonctionner.",
			"Après quelques minutes, quelqu’un demande timidement quand expire le certificat.",
		],
		question: "Avant même d’ouvrir le navigateur…",
		choices: [
			{
				text: "Tu connais déjà la réponse sans vouloir y croire.",
				feedback: "Certaines dates reviennent en mémoire plus vite que les anniversaires.",
			},
			{
				text: "Tu espères que ce n’était pas cette nuit.",
				feedback: "Le cerveau négocie toujours quelques secondes avec la réalité.",
			},
			{
				text: "Tu cherches qui devait recevoir l’alerte.",
				feedback: "La vraie enquête commence souvent après la panne.",
			},
			{
				text: "Tu regardes déjà le calendrier.",
				feedback: "Aujourd’hui, il devient un outil de diagnostic.",
			},
		],
	},
	{
		id: "CG-0027",
		category: "quotidien-it",
		context: [
			"Tu arrives un peu juste et la réunion commence dans moins de deux minutes.",
			"Le VPN refuse obstinément de se connecter tandis que la roue continue de tourner.",
			"Tu regardes l’écran sans vraiment savoir si tu attends encore ou si tu espères.",
		],
		question: "Sans même t’en rendre compte…",
		choices: [
			{
				text: "Tu recliques sur « Connecter ».",
				feedback: "Le deuxième clic n’a jamais été validé scientifiquement. Mais on continue.",
			},
			{
				text: "Tu prépares déjà ton excuse Teams.",
				feedback: "Le plan B démarre toujours avant la fin du plan A.",
			},
			{
				text: "Tu regardes l’icône réseau.",
				feedback: "Elle n’a rien demandé. Pourtant, elle devient immédiatement suspecte.",
			},
			{
				text: "Tu fixes la roue qui tourne.",
				feedback: "Comme si elle allait accélérer parce que tu la regardes.",
			},
		],
	},
	{
		id: "CG-0028",
		category: "projet",
		context: [
			"Le COPIL touche enfin à sa fin et les sacs commencent à se refermer.",
			"Tout le monde pense déjà au café lorsque le client reprend la parole avec un grand sourire.",
			"Il annonce qu’il reste seulement « une toute petite demande supplémentaire ».",
		],
		question: "À cet instant précis…",
		choices: [
			{
				text: "Tu regardes le chef de projet.",
				feedback: "Les visages parlent souvent avant les mots.",
			},
			{
				text: "Tu oublies immédiatement le mot « petite ».",
				feedback: "L’expérience t’a appris qu’il ne faut pas trop s’y attacher.",
			},
			{
				text: "Tu penses déjà au planning.",
				feedback: "Il vient probablement de perdre quelques jours d’espérance de vie.",
			},
			{
				text: "Tu souris poliment.",
				feedback: "Parce qu’il n’existe toujours pas de bouton « Quitter le COPIL ».",
			},
		],
	},
	{
		id: "CG-0029",
		category: "utilisateur",
		context: [
			"Tu arrives devant le poste d’un utilisateur persuadé qu’il n’a plus Internet.",
			"Le navigateur s’ouvre avec quarante-sept onglets, dont plusieurs semblent charger depuis longtemps.",
			"Une musique joue discrètement depuis un onglet impossible à identifier.",
		],
		question: "Ton premier réflexe…",
		choices: [
			{
				text: "Tu comptes vaguement les onglets.",
				feedback: "À partir de trente, le cerveau passe en mode approximation.",
			},
			{
				text: "Tu cherches celui qui fait du bruit.",
				feedback: "Il est toujours plus loin que prévu.",
			},
			{
				text: "Tu regardes directement la mémoire utilisée.",
				feedback: "Les habitudes prennent parfois le contrôle avant toi.",
			},
			{
				text: "Tu espères qu’un redémarrage suffira.",
				feedback: "Le support vit aussi grâce à quelques miracles.",
			},
		],
	},
	


	{
		id: "CG-0032",
		category: "support",
		context: [
			"Un utilisateur t’appelle parce que son écran est devenu noir.",
			"Après quelques questions, il précise que le voyant du moniteur est également éteint.",
			"Tu arrives sur place et découvres la multiprise coupée au pied du bureau.",
		],
		question: "Avant de dire quoi que ce soit…",
		choices: [
			{
				text: "Tu rallumes la multiprise en silence.",
				feedback: "Certaines résolutions méritent une grande sobriété.",
			},
			{
				text: "Tu vérifies quand même le câble vidéo.",
				feedback: "Même quand le coupable est là, l’habitude termine son tour.",
			},
			{
				text: "Tu prépares une phrase qui ne contient pas le mot « courant ».",
				feedback: "Le support est parfois un exercice de diplomatie électrique.",
			},
			{
				text: "Tu te demandes depuis combien de temps il attendait.",
				feedback: "L’information ne change rien. Mais le cerveau veut savoir.",
			},
		],
	},
	
	{
		id: "CG-0034",
		category: "reseau",
		context: [
			"Une application ne répond plus depuis un seul site, alors que tout fonctionne ailleurs.",
			"Les serveurs sont joignables et les logs applicatifs restent désespérément calmes.",
			"Quelqu’un finit par demander si le DNS local répond encore correctement.",
		],
		question: "À cet instant précis…",
		choices: [
			{
				text: "Tu lances un nslookup presque automatiquement.",
				feedback: "Le DNS n’est pas toujours coupable. Mais il est toujours interrogé.",
			},
			{
				text: "Tu compares avec un autre site.",
				feedback: "Rien ne rassure autant qu’un problème qui n’est pas partout.",
			},
			{
				text: "Tu demandes ce qui a changé sur le réseau local.",
				feedback: "La question arrive souvent avant la preuve, mais rarement sans raison.",
			},
			{
				text: "Tu gardes le ping pour la fin.",
				feedback: "Parce que « ça ping » n’a jamais raconté toute l’histoire.",
			},
		],
	},
	
	{
		id: "CG-0036",
		category: "projet",
		context: [
			"Le projet devait passer en production lundi matin.",
			"Vendredi après-midi, la recette n’est toujours pas signée et deux anomalies restent ouvertes.",
			"Quelqu’un propose malgré tout de maintenir la date « pour ne pas perdre le momentum ».",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Regarder qui prononce le mot « momentum ».",
				feedback: "Certains mots arrivent toujours accompagnés d’un risque.",
			},
			{
				text: "Demander où se trouve le plan de retour arrière.",
				feedback: "L’optimisme est plus agréable lorsqu’il possède un rollback.",
			},
			{
				text: "Relire les anomalies ouvertes.",
				feedback: "Le mot « mineure » change parfois de sens à l’approche de la production.",
			},
			{
				text: "Chercher qui validera réellement le go.",
				feedback: "Les décisions collectives ont souvent besoin d’un nom au dernier moment.",
			},
		],
	},
	{
		id: "CG-0037",
		category: "support",
		context: [
			"Un ticket est rouvert trois minutes après sa fermeture.",
			"Le demandeur explique que le problème initial est bien résolu, mais qu’il vient d’en remarquer un autre.",
			"Le nouveau sujet n’a aucun rapport avec le premier.",
		],
		question: "Sans même t’en rendre compte…",
		choices: [
			{
				text: "Tu relis l’objet du ticket.",
				feedback: "Parfois, on espère encore que le titre va remettre de l’ordre.",
			},
			{
				text: "Tu envisages de créer un nouveau ticket toi-même.",
				feedback: "Le découpage des sujets est aussi une forme de sécurité mentale.",
			},
			{
				text: "Tu souris devant le mot « rouvert ».",
				feedback: "Le ticket vient de découvrir une seconde carrière.",
			},
			{
				text: "Tu demandes une nouvelle description complète.",
				feedback: "Un nouveau problème mérite au moins un nouveau début.",
			},
		],
	},
	{
		id: "CG-0038",
		category: "cafe",
		context: [
			"Tu rejoins deux collègues à la machine à café après une réunion particulièrement longue.",
			"L’un d’eux te demande simplement si « le quick win » est toujours prévu.",
			"Le silence qui suit suffit à répondre avant toi.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Boire une gorgée avant de parler.",
				feedback: "Certaines réponses nécessitent un délai de stabilisation.",
			},
			{
				text: "Demander de quel quick win il parle.",
				feedback: "Il y en a souvent plusieurs. Aucun n’est vraiment rapide.",
			},
			{
				text: "Regarder si le chef de projet est dans les environs.",
				feedback: "Le contexte acoustique influence beaucoup la franchise.",
			},
			{
				text: "Répondre par un sourire très professionnel.",
				feedback: "La machine à café connaît plusieurs dialectes du silence.",
			},
		],
	},
	{
		id: "CG-0039",
		category: "architecture",
		context: [
			"Pendant un atelier, l’équipe présente une architecture dite transitoire.",
			"Le schéma contient déjà plusieurs composants spécifiques, deux exceptions et un flux manuel.",
			"Quelqu’un précise que l’ensemble sera remplacé « dans la cible ».",
		],
		question: "Tu comprends immédiatement que…",
		choices: [
			{
				text: "Le transitoire va avoir besoin d’un nom officiel.",
				feedback: "Dès qu’une architecture possède un acronyme, elle commence à s’installer.",
			},
			{
				text: "La cible est encore très loin.",
				feedback: "Plus elle est propre sur le slide, plus elle semble distante.",
			},
			{
				text: "Il faudra documenter les exceptions.",
				feedback: "Les exceptions non documentées deviennent rapidement des fonctionnalités.",
			},
			{
				text: "Quelqu’un maintiendra ce montage plus longtemps que prévu.",
				feedback: "Le provisoire trouve toujours un propriétaire. Souvent après son départ en production.",
			},
		],
	},
	{
		id: "CG-0040",
		category: "soc",
		context: [
			"Tu lances une recherche sur un IOC reçu dans un bulletin de menace.",
			"Le SIEM retourne plusieurs milliers de résultats répartis sur des postes parfaitement légitimes.",
			"Tu réalises que l’IOC est en fait un domaine public très largement utilisé.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Relire la source du bulletin.",
				feedback: "Le contexte transforme parfois un IOC inquiétant en simple morceau d’Internet.",
			},
			{
				text: "Ajouter immédiatement des filtres.",
				feedback: "La précision commence souvent après le premier mur de résultats.",
			},
			{
				text: "Vérifier la date de validité de l’IOC.",
				feedback: "Un indicateur sans temporalité est souvent un souvenir.",
			},
			{
				text: "Te demander combien d’équipes l’ont déjà bloqué.",
				feedback: "La même idée peut voyager très vite lorsqu’elle arrive en rouge.",
			},
		],
	},
	{
		id: "CG-0041",
		category: "utilisateur",
		context: [
			"Un utilisateur affirme que son mot de passe ne fonctionne plus depuis ce matin.",
			"Tu lui demandes de le retaper lentement pendant que tu regardes l’écran.",
			"Au troisième caractère, tu remarques que le clavier est passé en QWERTY.",
		],
		question: "Avant de l’interrompre…",
		choices: [
			{
				text: "Tu attends une seconde pour confirmer.",
				feedback: "Même les évidences méritent parfois un dernier caractère.",
			},
			{
				text: "Tu regardes l’indicateur de langue.",
				feedback: "Le petit détail en bas de l’écran vient de prendre toute la scène.",
			},
			{
				text: "Tu prépares une explication très courte.",
				feedback: "Le clavier a changé de langue. Pas besoin de créer un incident majeur.",
			},
			{
				text: "Tu repenses aux deux premiers essais.",
				feedback: "Ils étaient techniquement parfaits. Dans un autre pays.",
			},
		],
	},
	{
		id: "CG-0042",
		category: "firewall",
		context: [
			"Une règle de sécurité doit être supprimée après validation du métier.",
			"Le métier confirme qu’elle n’est plus utilisée, mais demande quand même de la conserver encore un mois.",
			"Le même échange avait déjà eu lieu le mois précédent.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Chercher la date de création de la règle.",
				feedback: "Parfois, l’ancienneté explique mieux la prudence que le trafic.",
			},
			{
				text: "Demander une date ferme cette fois.",
				feedback: "Le calendrier devient utile lorsqu’il cesse d’être décoratif.",
			},
			{
				text: "Regarder les logs des trente derniers jours.",
				feedback: "Les certitudes métiers sont plus confortables avec des preuves réseau.",
			},
			{
				text: "Ajouter un rappel sans trop y croire.",
				feedback: "Certaines suppressions vivent plusieurs vies avant d’arriver.",
			},
		],
	},
	{
		id: "CG-0043",
		category: "reunion",
		context: [
			"La réunion commence par un tour de table annoncé comme très rapide.",
			"Chaque personne profite pourtant de son passage pour raconter le contexte complet de son sujet.",
			"Quarante minutes plus tard, la première slide n’a toujours pas été affichée.",
		],
		question: "Sans même t’en rendre compte…",
		choices: [
			{
				text: "Tu comptes le nombre de personnes restantes.",
				feedback: "Le calcul mental devient un outil de planification.",
			},
			{
				text: "Tu regardes si quelqu’un écourte enfin son introduction.",
				feedback: "Le premier synthétique devient immédiatement un modèle.",
			},
			{
				text: "Tu repousses mentalement la réunion suivante.",
				feedback: "Elle n’a encore rien fait, mais elle vient déjà d’être impactée.",
			},
			{
				text: "Tu oublies pourquoi tu étais venu.",
				feedback: "Le tour de table a parfois plus de contexte que la réunion elle-même.",
			},
		],
	},
	
	

	{
		id: "CG-0050",
		category: "cafe",
		context: [
			"Tu retrouves un collègue à la machine à café après une mise en production nocturne.",
			"Il te dit simplement que « tout s’est bien passé », puis laisse un silence un peu trop long.",
			"Tu comprends que la deuxième partie de la phrase n’est pas encore arrivée.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Attendre sans poser de question.",
				feedback: "Certaines informations finissent toujours par sortir toutes seules.",
			},
			{
				text: "Prendre une gorgée avant la suite.",
				feedback: "Le café sert aussi de ponctuation.",
			},
			{
				text: "Demander ce qui ne s’est pas bien passé.",
				feedback: "La formulation évite de perdre du temps avec l’introduction.",
			},
			{
				text: "Regarder l’heure à laquelle il est parti.",
				feedback: "Le visage raconte beaucoup. L’horodatage raconte le reste.",
			},
		],
	},
	
	{
		id: "CG-0055",
		category: "quotidien-it",
		context: [
			"Tu branches ton ordinateur sur le dock en arrivant au bureau.",
			"Le clavier fonctionne, le réseau aussi, mais les deux écrans restent obstinément noirs.",
			"Tu débranches puis rebranches exactement le même câble, et tout s’allume.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Regarder le câble comme s’il devait s’excuser.",
				feedback: "Il ne dira rien. Mais il sait.",
			},
			{
				text: "Faire comme si cette manipulation était parfaitement logique.",
				feedback: "La maîtrise technique tient parfois à un mouvement très précis.",
			},
			{
				text: "Vérifier quand même les mises à jour du dock.",
				feedback: "Le miracle d’aujourd’hui peut devenir le ticket de demain.",
			},
			{
				text: "Ne surtout plus toucher à rien.",
				feedback: "Quand tout fonctionne enfin, la stabilité devient une priorité absolue.",
			},
		],
	},

	
	
	{
		id: "CG-0059",
		category: "projet",
		context: [
			"Le client demande une nouvelle fonctionnalité alors que la recette est déjà presque terminée.",
			"Il précise qu’elle est indispensable au go-live, mais qu’elle n’avait jamais été évoquée jusque-là.",
			"Le planning affiché à l’écran n’a pas encore bougé.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Demander ce qui rend la demande indispensable maintenant.",
				feedback: "Le besoin peut être nouveau. Ou simplement arriver très tard.",
			},
			{
				text: "Regarder le chef de projet.",
				feedback: "Certains arbitrages commencent par un échange de regards.",
			},
			{
				text: "Chiffrer l’impact avant de répondre.",
				feedback: "Une urgence sans estimation devient rapidement une promesse.",
			},
			{
				text: "Ouvrir mentalement la colonne « hors périmètre ».",
				feedback: "Elle vient peut-être de trouver son premier occupant.",
			},
		],
	},
	

	{
		id: "CG-0061",
		category: "support",
		context: [
			"Un utilisateur explique que son imprimante ne fonctionne plus depuis ce matin.",
			"Tu lances un test à distance et tout paraît normal.",
			"En arrivant sur place, tu découvres une feuille coincée depuis la veille avec le message « Bourrage papier » affiché en plein écran.",
		],
		question: "Avant de dire quoi que ce soit…",
		choices: [
			{
				text: "Tu retires la feuille en silence.",
				feedback: "Certaines résolutions gagnent à rester très sobres.",
			},
			{
				text: "Tu vérifies quand même le bac suivant.",
				feedback: "Une imprimante aime rarement limiter son histoire à un seul tiroir.",
			},
			{
				text: "Tu demandes depuis quand le message est affiché.",
				feedback: "La réponse ne changera rien, mais la curiosité a déjà pris le relais.",
			},
			{
				text: "Tu évites soigneusement le mot « bourrage ».",
				feedback: "Le support est aussi un métier de formulation.",
			},
		],
	},


	{
		id: "CG-0074",
		category: "quotidien-it",
		context: [
			"Tu fermes enfin ton ordinateur après une journée entièrement passée en réunion.",
			"Au moment de partir, Windows affiche qu’une mise à jour importante doit être installée avant l’arrêt.",
			"Le bouton « Mettre à jour et éteindre » semble soudain beaucoup plus engageant que prévu.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Regarder le pourcentage de batterie.",
				feedback: "La stratégie dépend parfois directement de ce petit chiffre.",
			},
			{
				text: "Chercher l’option « Éteindre quand même ».",
				feedback: "Le cerveau préfère toujours une négociation à une surprise.",
			},
			{
				text: "Brancher l’ordinateur avant de partir.",
				feedback: "Un geste simple qui ressemble beaucoup à un pari.",
			},
			{
				text: "Décider que demain est un autre jour.",
				feedback: "La mise à jour aussi.",
			},
		],
	},
	
	
	{
		id: "CG-0079",
		category: "reunion",
		context: [
			"Une réunion de suivi commence par la phrase « on va rester très opérationnels ».",
			"Quinze minutes plus tard, la discussion porte déjà sur la stratégie à trois ans.",
			"Le premier ticket concret attend toujours sur la slide suivante.",
		],
		question: "Sans même t’en rendre compte…",
		choices: [
			{
				text: "Tu regardes le titre de la réunion.",
				feedback: "Parfois, il reste le dernier lien avec l’objectif initial.",
			},
			{
				text: "Tu attends le retour au premier ticket.",
				feedback: "L’opérationnel reviendra peut-être après la vision.",
			},
			{
				text: "Tu notes les décisions qui n’en sont pas encore.",
				feedback: "Le compte-rendu aura besoin d’un peu de traduction.",
			},
			{
				text: "Tu vérifies combien de slides restent.",
				feedback: "Le chemin vers le concret est parfois numéroté.",
			},
		],
	},
	
	{
		id: "CG-0086",
		category: "cafe",
		context: [
			"Tu croises un collègue à la machine à café juste après une réunion avec l’éditeur.",
			"Il te dit que le support a demandé de refaire exactement le même test que la veille.",
			"Son café est déjà presque terminé alors qu’il vient seulement d’arriver.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Demander s’ils ont lu le ticket.",
				feedback: "Question naturelle. Réponse rarement vérifiable.",
			},
			{
				text: "Prendre un café plus grand.",
				feedback: "Certains échanges support demandent une capacité supplémentaire.",
			},
			{
				text: "Proposer de répondre avec les mêmes logs.",
				feedback: "La symétrie possède parfois une valeur thérapeutique.",
			},
			{
				text: "Éviter de dire « je te l’avais dit ».",
				feedback: "La machine à café apprécie la franchise. Pas toujours les collègues.",
			},
		],
	},
	
	{
		id: "CG-0088",
		category: "quotidien-it",
		context: [
			"Tu arrives dans une salle de réunion avec ton ordinateur et aucun adaptateur.",
			"Le seul écran disponible accepte uniquement du HDMI, tandis que ton portable n’a que de l’USB-C.",
			"Tout le monde attend déjà que la présentation commence.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Regarder autour de la table.",
				feedback: "Dans chaque réunion, quelqu’un possède peut-être le câble légendaire.",
			},
			{
				text: "Fouiller une deuxième fois dans ton sac.",
				feedback: "L’adaptateur n’y était pas la première fois. Mais l’espoir insiste.",
			},
			{
				text: "Proposer immédiatement un partage Teams.",
				feedback: "Le cloud sauve parfois les réunions de la connectique.",
			},
			{
				text: "Te souvenir exactement où tu as laissé l’adaptateur.",
				feedback: "La mémoire devient très performante une seconde trop tard.",
			},
		],
	},
	{
		id: "CG-0089",
		category: "reunion",
		context: [
			"Le client demande une démonstration en direct d’une fonctionnalité rarement utilisée.",
			"Personne ne l’avait prévue et l’environnement de démo n’a pas été vérifié.",
			"Tous les regards se tournent naturellement vers la personne la plus technique.",
		],
		question: "Ton premier réflexe est de…",
		choices: [
			{
				text: "Vérifier si quelqu’un d’autre porte le même prénom.",
				feedback: "Les probabilités sont faibles. Le réflexe reste parfaitement humain.",
			},
			{
				text: "Ouvrir discrètement l’environnement de démo.",
				feedback: "L’optimisme commence toujours par une page de connexion.",
			},
			{
				text: "Demander ce que le client souhaite voir exactement.",
				feedback: "Gagner du temps peut aussi ressembler à du cadrage.",
			},
			{
				text: "Préparer une phrase sur les données de test.",
				feedback: "Une démo surprise devient plus douce lorsqu’elle possède une limite.",
			},
		],
	},
	
];
