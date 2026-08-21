import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';

import { extractIngredientSection } from './label-text';

/** Thrown when OCR read nothing; the screen turns it into localized copy. */
export const NO_TEXT_FOUND = 'NO_TEXT_FOUND';

/**
 * Each script needs its own model: the Korean one also reads Latin (so Korean
 * and English labels come from that pass), kana needs the Japanese one, and
 * hanzi needs the Chinese one. All three already ship in the native build.
 */
const SCRIPTS = [
  TextRecognitionScript.KOREAN,
  TextRecognitionScript.JAPANESE,
  TextRecognitionScript.CHINESE,
];

/**
 * On-device text recognition (Google ML Kit).
 *
 * Every model gets a pass and the best read wins. They are independent native
 * calls, so `Promise.all` costs roughly one pass of wall-clock time.
 */
export async function detectIngredientsAsync(imageUri: string): Promise<string> {
  const reads = await Promise.all(
    SCRIPTS.map((script) => TextRecognition.recognize(imageUri, script))
  );

  // ponytail: "longest output wins" is a proxy for "right script" — the wrong
  // model on a label returns little or nothing. Chinese and Japanese share most
  // of their characters, so on a CJK label the two reads are close and either
  // one carries the allergen terms, which are matched in both spellings anyway.
  // Score by expected-script character ratio if a real label picks wrong.
  const result = reads.reduce((best, read) => (read.text.length > best.text.length ? read : best));

  const lines = result.text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error(NO_TEXT_FOUND);
  }

  // Ingredients only — the brand, address, phone number and nutrition table
  // are noise that produce false matches and clutter the saved scan.
  return extractIngredientSection(lines).join(' ');
}
