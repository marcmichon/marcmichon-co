export type PasswordMode = 'password' | 'passphrase';

export interface PasswordOptions {
	length: number;
	lowercase: boolean;
	uppercase: boolean;
	numbers: boolean;
	symbols: boolean;
	excludeAmbiguous: boolean;
	avoidRepeated: boolean;
}

export interface PassphraseOptions {
	wordCount: number;
	separator: '-' | '.' | '_' | ' ';
	capitalizeWords: boolean;
	appendNumber: boolean;
}

export interface GeneratedSecret {
	value: string;
	mode: PasswordMode;
	entropyBits: number;
	strength: 'Faible' | 'Correcte' | 'Robuste' | 'Très robuste';
	details: string[];
	suitableFor: string[];
}
