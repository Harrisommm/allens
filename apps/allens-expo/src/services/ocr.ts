export type OcrResult = {
  text: string;
  title?: string;
};

const SAMPLE_TEXT =
  'Ingredients: Water, Cane Sugar, Skim Milk Powder, Almond Extract, Vanilla, Soy Lecithin.';

export async function detectIngredientsAsync(imageUri: string): Promise<OcrResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    text: SAMPLE_TEXT,
    title: 'Sample imported label',
  };
}
