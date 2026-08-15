/**
 * Self-check for the allergen matcher — the one piece of logic here that can
 * hurt someone if it's wrong. No test framework on purpose.
 *
 *   node --experimental-strip-types src/services/allergy-matcher.check.ts
 */
import assert from 'node:assert/strict';

import {
  PRESET_ALLERGENS,
  findAllergenMatches,
  matchedAllergenNames,
  scanAllergenNames,
  splitByMatches,
  type Allergen,
} from './allergy-matcher.ts';

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

// a scan is judged on both readings — either one alone can miss the allergen
assert.deepEqual(
  scanAllergenNames({ originalText: '원재료: 우유', translatedText: 'Ingredients: dairy' }, allergens),
  ['Milk']
);
assert.deepEqual(
  scanAllergenNames({ originalText: '원재료: 대두', translatedText: 'Ingredients: bean' }, allergens),
  ['Soy']
);
assert.deepEqual(
  scanAllergenNames({ originalText: 'Water, Sugar', translatedText: '정제수, 설탕' }, allergens),
  []
);

// --- the shipped alias table ----------------------------------------------
//
// These run against PRESET_ALLERGENS itself, on raw label text with no
// translation anywhere. This is the fail-safe: if translation is unavailable —
// no API key, no network, dead quota — the danger flag still has to fire.
// A regression here shows the user a green "Safe" badge on a risky label.

const flags = (text: string) => matchedAllergenNames(findAllergenMatches(text, PRESET_ALLERGENS));

// Japanese
assert.deepEqual(flags('原材料名: 小麦粉、砂糖、全粉乳、大豆油'), ['Wheat', 'Milk', 'Soy']);
assert.deepEqual(flags('本品には乳成分・落花生を含みます'), ['Milk', 'Peanut']);
assert.deepEqual(flags('原材料: えび、かに、卵、そば'), ['Shellfish', 'Egg', 'Buckwheat']);

// Chinese, simplified and traditional — a label prints one or the other
assert.deepEqual(flags('配料: 小麦粉、白砂糖、全脂奶粉、大豆油'), ['Wheat', 'Milk', 'Soy']);
assert.deepEqual(flags('配料表: 水、花生酱、芝麻'), ['Peanut', 'Sesame']);
assert.deepEqual(flags('過敏原: 本產品含有蝦、蟹、雞蛋'), ['Shellfish', 'Egg']);
// 荞麦 "buckwheat" contains 麦 "wheat", so it flags both — the safe direction
assert.deepEqual(flags('配料: 鱼露、荞麦粉、猪肉'), ['Fish', 'Buckwheat', 'Wheat', 'Pork']);
assert.deepEqual(flags('配料: 水、白砂糖、食用盐'), []);

// Korean and English still match on the raw label, unchanged
assert.deepEqual(flags('원재료명: 밀가루, 전지분유(우유), 대두유'), ['Wheat', 'Milk', 'Soy']);
assert.deepEqual(flags('Ingredients: Wheat Flour, Skim Milk Powder, Soy Lecithin'), [
  'Wheat',
  'Milk',
  'Soy',
]);

// a label with none of them stays clean in every script
assert.deepEqual(flags('原材料名: 水、砂糖、食塩'), []);
assert.deepEqual(flags('원재료명: 정제수, 설탕, 소금'), []);

console.log('allergy-matcher: all checks passed');
