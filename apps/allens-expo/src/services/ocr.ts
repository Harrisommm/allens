import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';

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
    text: lines.join(' '),
    title: lines[0].slice(0, 60),
  };
}
