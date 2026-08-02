export interface BrevoContactSubscription {
	email: string;
	temporaryListId: number;
	attributes?: Record<string, string | number | boolean | string[]>;
}

export interface BrevoApiError {
	code?: string;
	message?: string;
}

const BREVO_CONTACTS_ENDPOINT = 'https://api.brevo.com/v3/contacts';

export async function addContactToTemporaryList(
	apiKey: string,
	subscription: BrevoContactSubscription,
): Promise<void> {
	const response = await fetch(BREVO_CONTACTS_ENDPOINT, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'api-key': apiKey,
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			email: subscription.email,
			listIds: [subscription.temporaryListId],
			attributes: subscription.attributes,
			emailBlacklisted: false,
			updateEnabled: true,
		}),
	});

	if (response.ok) return;

	const rawBody = await response.text();
	let apiError: BrevoApiError | undefined;

	try {
		apiError = JSON.parse(rawBody) as BrevoApiError;
	} catch {
		apiError = undefined;
	}

	const error = new Error(
		apiError?.message || `Brevo API error (${response.status})`,
	) as Error & {
		status?: number;
		code?: string;
		rawBody?: string;
	};

	error.status = response.status;
	error.code = apiError?.code;
	error.rawBody = rawBody;

	throw error;
}
