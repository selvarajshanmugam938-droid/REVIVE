import { en } from './en';
import { ta } from './ta';
import { hi } from './hi';
import { Language } from '../types';

export const translations = {
  en,
  ta,
  hi,
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}
