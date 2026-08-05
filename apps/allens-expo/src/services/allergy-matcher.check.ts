/**
 * Self-check for the allergen matcher — the one piece of logic here that can
 * hurt someone if it's wrong. No test framework on purpose.
 *
 *   node --experimental-strip-types src/services/allergy-matcher.check.ts
 */
import assert from 'node:assert/strict';

import { findAllergenMatches, matchedAllergenNames, splitByMatches, type Allergen } from './allergy-matcher.ts';

const allergens: Allergen[] = [
  { name: 'Milk', aliases: ['milk', '우유'] },
  { name: 'Soy', aliases: ['soy', '대두'] },
  { name: 'Tree nut', aliases: ['almond'] },
];

// finds matches regardless of case, inside longer words, in any script
const label = 'Ingredients: Water, Skim Milk Powder, Almond Extract, Soy Lecithin.';
assert.deepEqual(matchedAllergenNames(findAllergenMatches(label, allergens)), ['Milk', 'Tree nut', 'Soy']);
assert.deepEqual(matchedAllergenNames(findAllergenMatches('원재료: 정제수, 우유, 대두', allergens)), ['Milk', 'Soy']);

// no allergens selected, or none present -> no matches, no crash
assert.deepEqual(findAllergenMatches(label, []), []);
assert.deepEqual(findAllergenMatches('Water, Sugar, Salt', allergens), []);
assert.deepEqual(findAllergenMatches('', allergens), []);

// every occurrence is located, not just the first
const repeated = findAllergenMatches('milk, milk', allergens);
assert.equal(repeated.length, 2);
assert.deepEqual(repeated.map((m) => m.start), [0, 6]);

// rendering: segments reassemble to the original text, matched runs are tagged
const segments = splitByMatches(label, findAllergenMatches(label, allergens));
assert.equal(segments.map((s) => s.text).join(''), label);
assert.deepEqual(
  segments.filter((s) => s.allergen).map((s) => s.text),
  ['Milk', 'Almond', 'Soy']
);

// overlapping aliases paint each character once
const overlap: Allergen[] = [{ name: 'Soy', aliases: ['soy', 'soy lecithin'] }];
const overlapping = splitByMatches('Soy Lecithin', findAllergenMatches('Soy Lecithin', overlap));
assert.equal(overlapping.map((s) => s.text).join(''), 'Soy Lecithin');
assert.equal(overlapping.filter((s) => s.allergen).length, 1);

console.log('allergy-matcher: all checks passed');
