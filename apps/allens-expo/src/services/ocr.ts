import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';

import { extractIngredientSection, extractProductName } from './label-text';

export type OcrResult = {
  text: string;
  title?: string;
};

/**
 * On-device text recognition (Google ML Kit). The Korean recognizer also reads
 * Latin script, so it is the default for Korean labels with English ingredient
 * names — switch scripts here if you ship to another market.
 */
export async function detectIngredientsAsync(
  imageUri: string,
  script: TextRecognitionScript = TextRecognitionScript.KOREAN
): Promise<OcrResult> {
  const result = await TextRecognition.recognize(imageUri, script);
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
    // Undefined when the package has no readable name — the caller falls back
    // to the scan date rather than showing a barcode or a weight.
    title: extractProductName(lines),
  };
}
