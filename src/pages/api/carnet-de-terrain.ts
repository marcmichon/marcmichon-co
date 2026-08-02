import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { addContactToTemporaryList } from '../../lib/brevo';

export const prerender = false;

const MAX_REQUEST_BYTES = 8_192;
const CONSENT_TEXT_VERSION = 'carnet-v1-2026-08-02';

interface SubscriptionPayload {
	email?: unknown;
	consent?: unknown;
	company?: unknown;
	source?: unknown;
}

interface RuntimeEnvironment {
	BREVO_API_KEY?: string;
	BREVO_TEMP_LIST_ID?: string;
	PUBLIC_SITE_URL?: string;
}

export const POST: APIRoute = async ({ request }) => {
	const runtimeEnv = env as unknown as RuntimeEnvironment;

	try {
		if (!isJsonRequest(request)) {
			return jsonResponse(
				{ success: false, message: 'Format de requête invalide.' },
				415,
			);
		}

		const contentLength = Number(request.headers.get('content-length') || '0');

		if (contentLength > MAX_REQUEST_BYTES) {
			return jsonResponse(
				{ success: false, message: 'Requête trop volumineuse.' },
				413,
			);
		}

		if (!isAllowedOrigin(request, runtimeEnv.PUBLIC_SITE_URL)) {
			return jsonResponse(
				{ success: false, message: 'Origine de la requête refusée.' },
				403,
			);
		}

		const body = (await request.json()) as SubscriptionPayload;

		const email =
			typeof body.email === 'string'
				? body.email.trim().toLowerCase()
				: '';

		const consent = body.consent === true;

		const company =
			typeof body.company === 'string'
				? body.company.trim()
				: '';

		const source =
			typeof body.source === 'string' && body.source.trim()
				? body.source.trim().slice(0, 120)
				: 'page-carnet-de-terrain';

		if (company) {
			return subscriptionAccepted();
		}

		if (!isValidEmail(email)) {
			return jsonResponse(
				{
					success: false,
					message: 'Veuillez renseigner une adresse email valide.',
				},
				400,
			);
		}

		if (!consent) {
			return jsonResponse(
				{
					success: false,
					message:
						'Veuillez confirmer que vous acceptez de recevoir le Carnet de Terrain.',
				},
				400,
			);
		}

		const configuration = readConfiguration(runtimeEnv);

		if (!configuration.ok) {
			console.error(
				'Configuration Brevo incomplète :',
				configuration.missing,
			);

			return jsonResponse(
				{
					success: false,
					message:
						'Le service d’inscription est temporairement indisponible.',
				},
				503,
			);
		}

		await addContactToTemporaryList(configuration.apiKey, {
			email,
			temporaryListId: configuration.temporaryListId,
			attributes: {
				CONSENT_SOURCE: source,
				CONSENT_DATE: new Date().toISOString(),
				CONSENT_TEXT_VERSION,
			},
		});

		return subscriptionAccepted();
	} catch (error) {
		console.error('Erreur inscription Carnet de Terrain :', error);

		return jsonResponse(
			{
				success: false,
				message:
					'Impossible de traiter votre inscription pour le moment. Réessayez dans quelques instants.',
			},
			502,
		);
	}
};

function subscriptionAccepted(): Response {
	return jsonResponse(
		{
			success: true,
			message:
				'Un email de confirmation vient de vous être envoyé. Pensez à vérifier vos courriers indésirables.',
		},
		201,
	);
}

function isJsonRequest(request: Request): boolean {
	return request.headers
		.get('content-type')
		?.toLowerCase()
		.includes('application/json') === true;
}

function isAllowedOrigin(
	request: Request,
	publicSiteUrl?: string,
): boolean {
	const origin = request.headers.get('origin');

	if (!origin) return true;

	const allowedOrigins = new Set<string>([
		new URL(request.url).origin,
		'http://localhost:4321',
		'http://127.0.0.1:4321',
	]);

	if (publicSiteUrl) {
		try {
			allowedOrigins.add(new URL(publicSiteUrl).origin);
		} catch {
			console.error('PUBLIC_SITE_URL invalide.');
		}
	}

	return allowedOrigins.has(origin);
}

function isValidEmail(email: string): boolean {
	return (
		email.length <= 254 &&
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	);
}

function readConfiguration(runtimeEnv: RuntimeEnvironment):
	| {
			ok: true;
			apiKey: string;
			temporaryListId: number;
	  }
	| {
			ok: false;
			missing: string[];
	  } {
	const missing: string[] = [];

	if (!runtimeEnv.BREVO_API_KEY) missing.push('BREVO_API_KEY');
	if (!runtimeEnv.BREVO_TEMP_LIST_ID) {
		missing.push('BREVO_TEMP_LIST_ID');
	}

	const temporaryListId = Number(runtimeEnv.BREVO_TEMP_LIST_ID);

	if (
		runtimeEnv.BREVO_TEMP_LIST_ID &&
		(!Number.isInteger(temporaryListId) || temporaryListId <= 0)
	) {
		missing.push('BREVO_TEMP_LIST_ID invalide');
	}

	if (missing.length > 0) {
		return { ok: false, missing };
	}

	return {
		ok: true,
		apiKey: runtimeEnv.BREVO_API_KEY!,
		temporaryListId,
	};
}

function jsonResponse(
	payload: Record<string, unknown>,
	status: number,
): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			'cache-control': 'no-store',
			'content-type': 'application/json; charset=utf-8',
			'x-content-type-options': 'nosniff',
		},
	});
}
