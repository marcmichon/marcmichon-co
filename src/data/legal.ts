export const LEGAL = {
	siteName: 'marcmichon.co',
	siteUrl: 'https://marcmichon.co',

	// Éditeur non professionnel.
	publisherName: 'Marc Michon',
	publisherEmail: 'contact@marcmichon.co',
	publicationDirector: 'Marc Michon',

	host: {
		name: 'Cloudflare, Inc.',
		address: '101 Townsend Street, San Francisco, CA 94107, États-Unis',
		phone: '+1 650 319 8930',
	},

	// À renseigner lorsque Brevo (ou un autre prestataire) est définitivement choisi.
	newsletterProvider: {
		name: 'Brevo SAS',
		country: 'France',
		privacyUrl: 'https://www.brevo.com/fr/legal/privacypolicy/',
	},

	analytics: {
		name: 'Google Analytics 4',
		provider: 'Google Ireland Limited',
	},
} as const;
