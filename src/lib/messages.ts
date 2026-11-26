/**
 * i18n core (no React / no store imports) — safe to import from anywhere,
 * including the zustand store and canvas internals.
 *
 * Components should use `useT()` from `./i18n`; modules can register their
 * own packs with `registerMessages('ru', { … })`.
 */
import type { Language } from './settings'

export type Messages = Record<string, string>

export const DICTS: Record<Language, Messages> = {
  ru: {},
  en: {},
}

export function registerMessages(lang: Language, messages: Messages) {
  DICTS[lang] = { ...DICTS[lang], ...messages }
}

export function translate(
  lang: Language,
  key: string,
  fallback?: string,
): string {
  return DICTS[lang][key] ?? fallback ?? key
}

export type TFunction = (key: string, fallback?: string) => string

/** Non-reactive translator for modules that don't want a hook. */
export function makeT(lang: Language): TFunction {
  return (key, fallback) => translate(lang, key, fallback)
}
