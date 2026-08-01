import type {
	GeneratedSecret,
	PassphraseOptions,
	PasswordOptions,
} from '../../types/password';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?';
const AMBIGUOUS = new Set('0O1lI|`\'"');

const WORDS = [
	'acier', 'aigle', 'ambre', 'ancre', 'arcade', 'atlas', 'aurore', 'azur',
	'bambou', 'bastion', 'bison', 'brume', 'cabane', 'calme', 'canal', 'carbone',
	'cascade', 'cèdre', 'cobalt', 'comète', 'corail', 'cratère', 'cristal', 'cyprès',
	'delta', 'dune', 'éclipse', 'écume', 'érable', 'falcon', 'fjord', 'flamme',
	'forêt', 'galaxie', 'givre', 'granit', 'havre', 'horizon', 'jade', 'lagon',
	'lampe', 'lierre', 'loutre', 'lune', 'magma', 'mangue', 'marbre', 'mistral',
	'nébuleuse', 'nénuphar', 'nord', 'nuage', 'oasis', 'océan', 'olive', 'onyx',
	'orage', 'orbite', 'panda', 'perle', 'phare', 'piano', 'pinède', 'pixel',
	'plume', 'prairie', 'quartz', 'récif', 'rivage', 'rocher', 'sable', 'saphir',
	'saturne', 'silex', 'sommet', 'source', 'tango', 'tempête', 'tigre', 'tilleul',
	'topaze', 'torrent', 'toundra', 'vallée', 'velours', 'volcan', 'zéphyr', 'zinc',
] as const;

function secureRandomInt(maxExclusive: number): number {
	if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
		throw new RangeError('La borne aléatoire doit être un entier strictement positif.');
	}

	const maximumUint32 = 0x1_0000_0000;
	const rejectionLimit = maximumUint32 - (maximumUint32 % maxExclusive);
	const buffer = new Uint32Array(1);

	do {
		crypto.getRandomValues(buffer);
	} while (buffer[0] >= rejectionLimit);

	return buffer[0] % maxExclusive;
}

function pick<T>(values: readonly T[]): T {
	return values[secureRandomInt(values.length)];
}

function shuffle<T>(values: T[]): T[] {
	for (let index = values.length - 1; index > 0; index -= 1) {
		const randomIndex = secureRandomInt(index + 1);
		[values[index], values[randomIndex]] = [values[randomIndex], values[index]];
	}

	return values;
}

function normalizePool(pool: string, excludeAmbiguous: boolean): string {
	if (!excludeAmbiguous) return pool;
	return [...pool].filter((character) => !AMBIGUOUS.has(character)).join('');
}

function classifyStrength(entropyBits: number): GeneratedSecret['strength'] {
	if (entropyBits < 50) return 'Faible';
	if (entropyBits < 75) return 'Correcte';
	if (entropyBits < 110) return 'Robuste';
	return 'Très robuste';
}

function buildSuitability(entropyBits: number): string[] {
	const values = ['Compte personnel'];

	if (entropyBits >= 70) values.push('Gestionnaire de mots de passe');
	if (entropyBits >= 90) values.push('Compte administrateur');
	if (entropyBits >= 110) values.push('Compte de service');

	return values;
}

export function generatePassword(options: PasswordOptions): GeneratedSecret {
	const length = Math.min(128, Math.max(8, Math.trunc(options.length)));
	const selectedPools = [
		options.lowercase ? normalizePool(LOWERCASE, options.excludeAmbiguous) : '',
		options.uppercase ? normalizePool(UPPERCASE, options.excludeAmbiguous) : '',
		options.numbers ? normalizePool(NUMBERS, options.excludeAmbiguous) : '',
		options.symbols ? normalizePool(SYMBOLS, options.excludeAmbiguous) : '',
	].filter(Boolean);

	if (selectedPools.length === 0) {
		throw new Error('Activez au moins une catégorie de caractères.');
	}

	if (length < selectedPools.length) {
		throw new Error('La longueur doit permettre d’inclure chaque catégorie active.');
	}

	const completePool = selectedPools.join('');
	const result = selectedPools.map((pool) => pick([...pool]));

	while (result.length < length) {
		const candidates = options.avoidRepeated && result.length > 0
			? [...completePool].filter((character) => character !== result[result.length - 1])
			: [...completePool];

		result.push(pick(candidates.length > 0 ? candidates : [...completePool]));
	}

	const value = shuffle(result).join('');
	const entropyBits = length * Math.log2(completePool.length);
	const roundedEntropy = Math.round(entropyBits);
	const details = [
		`${length} caractères`,
		`${selectedPools.length} catégorie${selectedPools.length > 1 ? 's' : ''} active${selectedPools.length > 1 ? 's' : ''}`,
		`${roundedEntropy} bits d’entropie théorique`,
		'Génération cryptographique locale',
	];

	if (options.excludeAmbiguous) details.push('Caractères ambigus exclus');
	if (options.avoidRepeated) details.push('Répétitions consécutives évitées');

	return {
		value,
		mode: 'password',
		entropyBits: roundedEntropy,
		strength: classifyStrength(entropyBits),
		details,
		suitableFor: buildSuitability(entropyBits),
	};
}

export function generatePassphrase(options: PassphraseOptions): GeneratedSecret {
	const wordCount = Math.min(10, Math.max(3, Math.trunc(options.wordCount)));
	const availableWords = [...WORDS];
	const selectedWords: string[] = [];

	while (selectedWords.length < wordCount) {
		const index = secureRandomInt(availableWords.length);
		const [word] = availableWords.splice(index, 1);
		selectedWords.push(
			options.capitalizeWords
				? `${word.charAt(0).toUpperCase()}${word.slice(1)}`
				: word,
		);
	}

	let value = selectedWords.join(options.separator);
	let extraCombinations = 1;

	if (options.appendNumber) {
		const number = secureRandomInt(100);
		value += `${options.separator}${String(number).padStart(2, '0')}`;
		extraCombinations *= 100;
	}

	const combinations = Math.pow(WORDS.length, wordCount) * extraCombinations;
	const entropyBits = Math.log2(combinations);
	const roundedEntropy = Math.round(entropyBits);
	const details = [
		`${wordCount} mots distincts`,
		`${value.length} caractères au total`,
		`${roundedEntropy} bits d’entropie théorique`,
		'Génération cryptographique locale',
		'Plus simple à saisir et à mémoriser',
	];

	if (options.appendNumber) details.push('Suffixe numérique aléatoire');

	return {
		value,
		mode: 'passphrase',
		entropyBits: roundedEntropy,
		strength: classifyStrength(entropyBits),
		details,
		suitableFor: buildSuitability(entropyBits),
	};
}
