import fr from './fr';
import en from './en';

export type Locale = 'fr' | 'en';
export const DEFAULT_LOCALE: Locale = 'fr';

const locales = { fr, en } as const;

export function getTranslations(locale: Locale = DEFAULT_LOCALE) {
  return locales[locale];
}

export { fr, en };
