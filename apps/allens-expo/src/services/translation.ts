import { getLocales } from 'expo-localization';

/**
 * Google Cloud Translation (v2 REST) — plain fetch, no SDK needed.
 *
 * The key ships inside the app bundle, so restrict it in Google Cloud Console
 * to the Translation API and to this app's bundle id / SHA-1. Without a key the
 * app still works: text is shown untranslated and allergen matching runs on the
 * original label, which is the language the label was printed in anyway.
 */
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY;

export async function translateTextAsync(text: string, targetLocale: string): Promise<string> {
  const target = targetLocale.split('-')[0];
  if (!API_KEY || !text.trim()) return text;

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target, format: 'text' }),
      }
    );

    if (!response.ok) return text;
    const json = await response.json();
    return json?.data?.translations?.[0]?.translatedText ?? text;
  } catch {
    // A failed translation must never lose the scan.
    return text;
  }
}

/**
 * The language to translate into ("ko", "en", "ja", …).
 *
 * This is the app's own language as chosen in the OS per-app language settings,
 * which starts out as the device language and is user-changeable — `app.json`
 * declares `supportedLocales` so iOS and Android offer that picker at all.
 * Android lets it change while the app is running, so read it per scan rather
 * than caching it.
 */
export function deviceLanguage(): string {
  return getLocales()[0]?.languageCode ?? 'en';
}
