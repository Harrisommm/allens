import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';

import { extractIngredientSection } from './label-text';

export type OcrResult = {
  text: string;
};

/**
 * On-device text recognition (Google ML Kit).
 *
 * Each script needs its own model: the Korean one also reads Latin (so Korean
 * and English labels come from that pass), but kana and kanji need the Japanese
 * one. Both models already ship in the native build, so we simply run both and
 * keep the better read. They are independent native calls, so `Promise.all`
 * costs roughly one pass of wall-clock time.
 */
export async function detectIngredientsAsync(imageUri: string): Promise<OcrResult> {
  const [korean, japanese] = await Promise.all([
    TextRecognition.recognize(imageUri, TextRecognitionScript.KOREAN),
    TextRecognition.recognize(imageUri, TextRecognitionScript.JAPANESE),
  ]);

  // ponytail: "longest output wins" is a proxy for "right script" — the wrong
  // model on a label returns little or nothing. Score by expected-script
  // character ratio if a real label ever picks the wrong one.
  const result = japanese.text.length > korean.text.length ? japanese : korean;

  const lines = result.text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('No text found. Move closer to the label and try again.');
  }

  return {
    // Ingredients only — the brand, address, phone number and nutrition table
    // are noise that produce false matches and clutter the saved scan.
    text: extractIngredientSection(lines).join(' '),
  };
}
