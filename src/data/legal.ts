export const LEGAL = {
	siteName: 'marcmichon.co',
	siteUrl: 'https://marcmichon.co',

	// Éditeur non professionnel.
	publisherName: 'Marc Michon',
	publisherEmail: 'michon.marc@gmail.com',
	publicationDirector: 'Marc Michon',

	host: {
		name: 'Cloudflare, Inc.',
		address: '101 Townsend Street, San Francisco, CA 94107, États-Unis',
		phone: '+1 650 319 8930',
	},

	// À renseigner lorsque Brevo (ou un autre prestataire) est définitivement choisi.
	newsletterProvider: {
		name: 'À compléter avant mise en production',
		country: 'À compléter',
		privacyUrl: '',
	},

	analytics: {
		name: 'Google Analytics 4',
		provider: 'Google Ireland Limited',
	},
} as const;
