export type Allergen = {
  /** Display name, e.g. "Tree nut". */
  name: string;
  /** Every spelling that means this allergen, in any language the label might use. */
  aliases: string[];
};

export type AllergenMatch = {
  allergen: string;
  /** The alias as it appears in the text. */
  term: string;
  start: number;
  end: number;
};

/**
 * Case-insensitive substring search for every alias of every allergen.
 * Substring (not word-boundary) on purpose: "밀가루" contains "밀", and
 * "Skim Milk Powder" contains "milk". False positives are the safe direction
 * for an allergy app; a missed match is the dangerous one.
 */
export function findAllergenMatches(text: string, allergens: Allergen[]): AllergenMatch[] {
  const haystack = text.toLowerCase();
  const matches: AllergenMatch[] = [];

  for (const allergen of allergens) {
    for (const alias of allergen.aliases) {
      const needle = alias.trim().toLowerCase();
      if (!needle) continue;

      let from = 0;
      while (from <= haystack.length) {
        const start = haystack.indexOf(needle, from);
        if (start === -1) break;
        matches.push({
          allergen: allergen.name,
          term: text.slice(start, start + needle.length),
          start,
          end: start + needle.length,
        });
        from = start + needle.length;
      }
    }
  }

  return matches.sort((a, b) => a.start - b.start || b.end - a.end);
}

/** Distinct allergen names, in the order they first appear in the text. */
export function matchedAllergenNames(matches: AllergenMatch[]): string[] {
  return [...new Set(matches.map((match) => match.allergen))];
}

/**
 * Splits text into runs for rendering, merging overlapping matches so
 * "soy lecithin" and "soy" don't paint the same characters twice.
 */
export function splitByMatches(text: string, matches: AllergenMatch[]) {
  const segments: { text: string; allergen?: string }[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start < cursor) continue; // already covered by an earlier, longer match
    if (match.start > cursor) segments.push({ text: text.slice(cursor, match.start) });
    segments.push({ text: text.slice(match.start, match.end), allergen: match.allergen });
    cursor = match.end;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
