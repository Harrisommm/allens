import { getLocales } from 'expo-localization';

import { uiLanguageFrom, type UiLanguage } from './strings';

/**
 * Google Cloud Translation (v2 REST) — plain fetch, no SDK needed.
 *
 * The key ships inside the app bundle, so restrict it in Google Cloud Console
 * to the Translation API and to this app's bundle id / SHA-1. Without a key the
 * app still works: text is shown untranslated and allergen matching runs on the
 * original label, which is the language the label was printed in anyway.
 */
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY;

/**
 * Translates several strings in one request — `q` repeats, and the response
 * comes back in the same order. A label is read as an ingredient block plus an
 * optional cross-contact advisory, and both have to be readable, so batching
 * keeps that at one network round trip instead of two.
 *
 * Returns the input unchanged on any failure, so a scan is never lost.
 */
export async function translateTextAsync(texts: string[], target: string): Promise<string[]> {
  if (!API_KEY || !texts.some((text) => text.trim())) return texts;

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: texts, target, format: 'text' }),
      }
    );

    if (!response.ok) return texts;
    const json = await response.json();
    const translations = json?.data?.translations;
    // A short or reordered response would silently pair an advisory with the
    // ingredient text, so anything but an exact match is treated as a failure.
    if (!Array.isArray(translations) || translations.length !== texts.length) return texts;
    return translations.map((entry, index) => entry?.translatedText ?? texts[index]);
  } catch {
    // A failed translation must never lose the scan.
    return texts;
  }
}

/**
 * The language to translate into ("ko", "en", "ja", "zh-TW", …), as a code the
 * Translation API takes directly.
 *
 * This is the app's own language as chosen in the OS per-app language settings,
 * which starts out as the device language and is user-changeable — `app.json`
 * declares `supportedLocales` so iOS and Android offer that picker at all.
 * Android lets it change while the app is running, so read it per scan rather
 * than caching it.
 */
export function deviceLanguage(): string {
  const locale = getLocales()[0];
  const language = locale?.languageCode ?? 'en';

  // Chinese is the one case where the language code isn't enough: bare "zh"
  // comes back Simplified, which a Traditional reader can't comfortably read.
  if (language === 'zh') return locale?.languageScriptCode === 'Hant' ? 'zh-TW' : 'zh-CN';

  return language;
}

/**
 * The language the app's own copy is written in — a much shorter list than the
 * languages it can *translate into*. A Spanish speaker gets Spanish scan
 * results and an English interface, which is the honest trade: bad UI copy in a
 * safety app is worse than English copy.
 */
export function uiLanguage(): UiLanguage {
  return uiLanguageFrom(getLocales()[0]?.languageCode);
}
