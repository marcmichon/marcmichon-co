import {
	calculateRisk,
	type RiskInput,
	type RiskResult,
} from './riskEngine';

import { normalizeRiskLevel } from './riskLabels';
import { buildCompleteRiskReport } from './riskReport';

interface RiskAppState {
	lastInput: RiskInput | null;
	lastResult: RiskResult | null;
}

const state: RiskAppState = {
	lastInput: null,
	lastResult: null,
};

function getElement<T extends Element>(
	selector: string,
	root: ParentNode = document
): T | null {
	return root.querySelector<T>(selector);
}

function getRequiredElement<T extends Element>(
	selector: string,
	root: ParentNode = document
): T {
	const element = getElement<T>(selector, root);

	if (!element) {
		throw new Error(
			`MM Risk Score : élément introuvable (${selector}).`
		);
	}

	return element;
}

function getRadioValue(
	form: HTMLFormElement,
	name: string
): string {
	const input = getElement<HTMLInputElement>(
		`input[name="${name}"]:checked`,
		form
	);

	return input?.value ?? '';
}

function getChecked(
	form: HTMLFormElement,
	name: string
): boolean {
	const input = getElement<HTMLInputElement>(
		`input[name="${name}"]`,
		form
	);

	return Boolean(input?.checked);
}

function setText(selector: string, value: string): void {
	const element = getElement<HTMLElement>(selector);

	if (element) {
		element.textContent = value;
	}
}

function setUnorderedList(
	selector: string,
	items: string[],
	emptyMessage: string
): void {
	const list = getElement<HTMLUListElement>(selector);

	if (!list) {
		return;
	}

	list.replaceChildren();

	const values =
		items.length > 0 ? items : [emptyMessage];

	for (const item of values) {
		const listItem = document.createElement('li');
		listItem.textContent = item;
		list.appendChild(listItem);
	}
}

function setOrderedList(
	selector: string,
	items: string[],
	emptyMessage: string
): void {
	const list = getElement<HTMLOListElement>(selector);

	if (!list) {
		return;
	}

	list.replaceChildren();

	const values =
		items.length > 0 ? items : [emptyMessage];

	for (const item of values) {
		const listItem = document.createElement('li');
		listItem.textContent = item;
		list.appendChild(listItem);
	}
}

function showValidationError(message: string): void {
	window.alert(message);
}

function readRiskForm(
	form: HTMLFormElement
): RiskInput | null {
	const scenario =
		getElement<HTMLTextAreaElement>(
			'#scenario',
			form
		)?.value.trim() ?? '';

	const assetType =
		getElement<HTMLSelectElement>(
			'#asset-type',
			form
		)?.value ?? '';

	const exposure =
		getElement<HTMLSelectElement>(
			'#exposure',
			form
		)?.value ?? '';

	const criticalityValue =
		getRadioValue(form, 'criticality');

	const publicExploitValue =
		getRadioValue(form, 'publicExploit');

	const authenticationValue =
		getRadioValue(form, 'authenticationRequired');

	const cvssRaw =
		getElement<HTMLInputElement>(
			'#cvss',
			form
		)?.value ?? '';

	const epssRaw =
		getElement<HTMLInputElement>(
			'#epss',
			form
		)?.value ?? '';

	const cvss = Number(cvssRaw);
	const epss = Number(epssRaw);
	const criticality = Number(criticalityValue);

	if (
		!scenario ||
		!assetType ||
		!exposure ||
		!criticalityValue ||
		!publicExploitValue ||
		!authenticationValue ||
		cvssRaw === '' ||
		epssRaw === ''
	) {
		showValidationError(
			'Complète tous les champs obligatoires du contexte et de l’exploitabilité.'
		);

		return null;
	}

	if (
		!Number.isFinite(cvss) ||
		cvss < 0 ||
		cvss > 10
	) {
		showValidationError(
			'Le score CVSS doit être compris entre 0 et 10.'
		);

		return null;
	}

	if (
		!Number.isFinite(epss) ||
		epss < 0 ||
		epss > 100
	) {
		showValidationError(
			'Le score EPSS doit être compris entre 0 et 100 %.'
		);

		return null;
	}

	return {
		scenario,
		assetType,
		exposure,
		criticality,
		cvss,
		epss,

		publicExploit:
			publicExploitValue === 'yes',

		authenticationRequired:
			authenticationValue === 'yes',

		sensitiveData:
			getChecked(form, 'sensitiveData'),

		businessInterruption:
			getChecked(form, 'businessInterruption'),

		privilegedAccess:
			getChecked(form, 'privilegedAccess'),

		lateralMovement:
			getChecked(form, 'lateralMovement'),

		controls: {
			edr: getChecked(form, 'edr'),
			waf: getChecked(form, 'waf'),
			mfa: getChecked(form, 'mfa'),

			segmentation:
				getChecked(form, 'segmentation'),

			backups:
				getChecked(form, 'backups'),

			soc:
				getChecked(form, 'soc'),
		},
	};
}

function renderRiskResult(
	resultSection: HTMLElement,
	result: RiskResult
): void {
	setText('#result-score', String(result.score));
	setText('#result-level', result.level);
	setText('#result-priority', result.priority);
	setText('#result-deadline', result.deadline);

	setText(
		'#result-probability',
		String(result.probability)
	);

	setText(
		'#result-impact',
		String(result.impact)
	);

	setText(
		'#result-reduction',
		String(result.controlReduction)
	);

	setText('#result-summary', result.summary);

	const progressBar =
		getElement<HTMLElement>('#score-progress-bar');

	if (progressBar) {
		progressBar.style.width = '0%';

		window.requestAnimationFrame(() => {
			progressBar.style.width =
				`${result.score}%`;
		});
	}

	resultSection.dataset.level =
		normalizeRiskLevel(result.level);

	setUnorderedList(
		'#risk-factors-list',
		result.riskFactors,
		'Aucun facteur aggravant majeur identifié.'
	);

	setUnorderedList(
		'#protective-factors-list',
		result.protectiveFactors,
		'Aucun contrôle compensatoire déclaré.'
	);

	setOrderedList(
		'#recommendations-list',
		result.recommendations,
		'Documenter le scénario et organiser une revue du risque.'
	);

	resultSection.hidden = false;

	window.requestAnimationFrame(() => {
		resultSection.classList.add('is-visible');
	});

	window.setTimeout(() => {
		resultSection.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		});
	}, 100);
}

async function copyLastRiskAnalysis(
	button: HTMLButtonElement
): Promise<void> {
	if (!state.lastInput || !state.lastResult) {
		button.textContent = 'Aucune analyse disponible';

		window.setTimeout(() => {
			button.textContent = 'Copier l’analyse';
		}, 1800);

		return;
	}

	const report = buildCompleteRiskReport(
		state.lastInput,
		state.lastResult
	);

	try {
		await navigator.clipboard.writeText(report);

		button.textContent =
			'Analyse complète copiée';
	} catch (error) {
		console.error(
			'Impossible de copier l’analyse.',
			error
		);

		button.textContent = 'Copie impossible';
	}

	window.setTimeout(() => {
		button.textContent = 'Copier l’analyse';
	}, 1800);
}

export function initRiskMatrix(): void {
	const form =
		getRequiredElement<HTMLFormElement>(
			'#risk-form'
		);

	/*
	 * Évite d’enregistrer plusieurs fois les événements
	 * en cas de navigation Astro ou de réinitialisation.
	 */
	if (form.dataset.initialized === 'true') {
		return;
	}

	form.dataset.initialized = 'true';

	const calculateButton =
		getRequiredElement<HTMLButtonElement>(
			'#calculate-risk'
		);

	const resultSection =
		getRequiredElement<HTMLElement>(
			'#risk-result'
		);

	const copyButton =
		getElement<HTMLButtonElement>(
			'#copy-analysis'
		);

	calculateButton.addEventListener(
		'click',
		() => {
			const input = readRiskForm(form);

			if (!input) {
				return;
			}

			const result = calculateRisk(input);

			state.lastInput = input;
			state.lastResult = result;

			renderRiskResult(
				resultSection,
				result
			);
		}
	);

	copyButton?.addEventListener(
		'click',
		() => {
			void copyLastRiskAnalysis(copyButton);
		}
	);
}