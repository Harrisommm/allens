export function findAllergenMatches(text: string, allergens: string[]) {
  const normalized = text.toLowerCase();
  return allergens.filter((allergen) => normalized.includes(allergen.toLowerCase()));
}
