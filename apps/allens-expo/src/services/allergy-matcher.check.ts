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
  scanVerdict,
  searchAllergens,
  splitByMatches,
  type Allergen,
} from './allergy-matcher.ts';
import { allergenLabel } from './strings.ts';

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

// --- contains vs. may contain ----------------------------------------------
//
// The distinction no database-backed scanner can make, so it has to be right
// here. The failure that matters is a downgrade: showing amber "may contain"
// for an allergen the label plainly lists as an ingredient.

// named only in the advisory -> advisory, not direct
assert.deepEqual(
  scanVerdict(
    {
      originalText: '원재료명: 정제수, 설탕',
      translatedText: 'Ingredients: water, sugar',
      advisoryText: '본 제품은 우유와 같은 시설에서 제조',
      translatedAdvisoryText: 'Made in a facility that also processes milk',
    },
    allergens
  ),
  { direct: [], advisory: ['Milk'] }
);

// named in the ingredients -> direct, and the advisory list stays empty
assert.deepEqual(
  scanVerdict(
    { originalText: '원재료명: 우유', translatedText: 'Ingredients: milk' },
    allergens
  ),
  { direct: ['Milk'], advisory: [] }
);

// named in BOTH -> direct wins outright; it must never appear as "may contain"
assert.deepEqual(
  scanVerdict(
    {
      originalText: '원재료명: 우유, 설탕',
      translatedText: 'Ingredients: milk, sugar',
      advisoryText: '대두, 우유 혼입 가능',
      translatedAdvisoryText: 'May contain soy and milk',
    },
    allergens
  ),
  { direct: ['Milk'], advisory: ['Soy'] }
);

// a scan saved before the split has no advisory text at all: everything it
// names stays direct, so an old scan can never be softened by the new code
assert.deepEqual(
  scanVerdict(
    {
      originalText: '원재료명: 정제수 알레르기 유발물질: 우유 함유',
      translatedText: 'Ingredients: water. Contains milk.',
    },
    allergens
  ),
  { direct: ['Milk'], advisory: [] }
);

// nothing anywhere -> clean on both counts
assert.deepEqual(
  scanVerdict(
    {
      originalText: 'Water, Sugar',
      translatedText: '정제수, 설탕',
      advisoryText: 'May contain traces of nothing relevant',
      translatedAdvisoryText: '해당 없음',
    },
    allergens
  ),
  { direct: [], advisory: [] }
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
// 雞蛋 "chicken egg" contains 雞 "chicken", so it flags both — the safe direction
assert.deepEqual(flags('過敏原: 本產品含有蝦、蟹、雞蛋'), ['Shellfish', 'Chicken', 'Egg']);
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

// --- terms that used to slip through ---------------------------------------
//
// Every one of these is printed on real labels and was missed by the table:
// the allergen word simply isn't a substring of the ingredient name. They are
// caught once translation runs ("소맥분" -> "wheat flour"), so these assertions
// guard the *offline* path, which is the one that has to hold when the network
// doesn't.

assert.deepEqual(flags('원재료명: 소맥분, 정제소금'), ['Wheat']);
assert.deepEqual(flags('원재료명: 커피믹스(카제인나트륨 함유)'), ['Milk']);
assert.deepEqual(flags('원재료명: 액젓, 고춧가루'), ['Fish']);
assert.deepEqual(flags('원재료명: 난백알부민, 전란액'), ['Egg']);
assert.deepEqual(flags('원재료명: 연유, 유고형분'), ['Milk']);
assert.deepEqual(flags('原材料名: 全卵、リゾチーム'), ['Egg']);
// 酪蛋白 "casein" contains 蛋白 "egg white", so Egg rides along — safe direction
assert.deepEqual(flags('配料: 小麦淀粉、酪蛋白酸钠'), ['Wheat', 'Milk', 'Egg']);

// --- the five Latin-script languages ---------------------------------------
//
// These already OCR today (the Korean ML Kit model reads Latin), so before
// this table they scanned fine and were judged on nothing offline.

assert.deepEqual(flags('Ingredientes: harina de trigo, leche, huevo, soja'), [
  'Wheat',
  'Milk',
  'Egg',
  'Soy',
]);
assert.deepEqual(flags('Ingredienti: farina di grano, latte, uova, nocciola'), [
  'Wheat',
  'Milk',
  'Egg',
  'Tree nut',
]);
assert.deepEqual(flags("Ingrédients: farine de blé, lait, oeuf, arachide"), [
  'Wheat',
  'Milk',
  'Egg',
  'Peanut',
]);
assert.deepEqual(flags('Zutaten: Weizenmehl, Milch, Hühnerei, Sellerie, Senf'), [
  'Wheat',
  'Milk',
  'Egg',
  'Celery',
  'Mustard',
]);
assert.deepEqual(flags('Thành phần: bột mì, sữa, trứng, đậu phộng, tôm'), [
  'Wheat',
  'Milk',
  'Egg',
  'Peanut',
  'Shellfish',
]);

// the new allergens fire in the languages that legally require them
assert.deepEqual(flags('Ingredientes: apio, mostaza, altramuz'), ['Celery', 'Mustard', 'Lupin']);
assert.deepEqual(flags('원재료명: 복숭아 과즙, 토마토 페이스트'), ['Peach', 'Tomato']);
assert.deepEqual(flags('원재료명: 오징어, 닭고기, 쇠고기, 젤라틴'), [
  'Squid',
  'Chicken',
  'Beef',
  'Gelatin',
]);

// --- aggregate noise: a clean label must stay clean in every language -------
//
// An alias that fires on an ordinary water-sugar-salt list would red every
// label in its language, and a badge that is always red is a badge nobody
// reads. This is the guard against "add it just to be safe".

for (const clean of [
  'Ingredients: water, sugar, salt, citric acid',
  '원재료명: 정제수, 백설탕, 정제소금, 구연산',
  '原材料名: 水、砂糖、食塩、クエン酸',
  '配料: 水、白砂糖、食用盐、柠檬酸',
  'Ingredientes: agua, azúcar, sal, ácido cítrico',
  'Ingredienti: acqua, zucchero, sale, acido citrico',
  'Ingrédients: eau, sucre, sel, acide citrique',
  'Zutaten: Wasser, Zucker, Salz, Zitronensäure',
  'Thành phần: nước, đường, muối, axit citric',
]) {
  assert.deepEqual(flags(clean), [], `clean label flagged: ${clean}`);
}

// --- setup-screen search ----------------------------------------------------
//
// Searching only the display names would make a nine-language table unusable:
// nobody types "Shellfish" when the word they know is 새우.

const found = (query: string) => searchAllergens(query).map((allergen) => allergen.name);

assert.deepEqual(found('새우'), ['Shellfish']);
assert.deepEqual(found('Sellerie'), ['Celery']);
assert.deepEqual(found('うし'), []); // not an alias; 牛肉 is
assert.deepEqual(found('牛肉'), ['Beef']);
assert.deepEqual(found('MILK'), ['Milk']); // case-insensitive
assert.deepEqual(found('  gluten  '), ['Wheat']); // trimmed
assert.deepEqual(found('đậu phộng'), ['Peanut']);
assert.deepEqual(found('zzzz'), []);
assert.equal(searchAllergens('').length, PRESET_ALLERGENS.length); // blank shows all
assert.equal(searchAllergens('   ').length, PRESET_ALLERGENS.length);

// --- structural: no Latin-script alias shorter than three characters --------
//
// Two-character Latin aliases are the specific failure this table has to avoid
// — Vietnamese "cá" sits inside "các", German "Ei" inside "Protein". CJK is
// exempt: its character space doesn't collide the same way, and single
// characters there (乳, 麦, 게) carry a whole word.

const CJK = /[\p{sc=Han}\p{sc=Hangul}\p{sc=Hiragana}\p{sc=Katakana}]/u;
for (const allergen of PRESET_ALLERGENS) {
  for (const alias of allergen.aliases) {
    assert.ok(alias.trim().length > 0, `${allergen.name}: empty alias`);
    if (!CJK.test(alias)) {
      assert.ok(
        alias.replace(/\s/g, '').length >= 3,
        `${allergen.name}: Latin alias "${alias}" is too short to match safely`
      );
    }
  }
}

// --- every preset has a display name in every UI language -------------------
//
// The copy tables are typechecked against `en`, but the allergen labels are
// keyed by data, so a preset added without its Korean name would silently show
// English on a Korean phone. Caught here instead.

for (const allergen of PRESET_ALLERGENS) {
  for (const language of ['ko', 'ja'] as const) {
    const label = allergenLabel(allergen.name, language);
    assert.notEqual(label, allergen.name, `${allergen.name}: no ${language} label`);
  }
}
// custom allergens are user-typed, so they pass through untouched
assert.equal(allergenLabel('mustard seed', 'ko'), 'mustard seed');

console.log('allergy-matcher: all checks passed');
