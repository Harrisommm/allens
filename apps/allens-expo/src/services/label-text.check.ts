/**
 * Self-check for ingredient-section extraction. Trimming a label wrongly can
 * hide an allergen, so the "keeps things it shouldn't drop" cases matter more
 * than the tidy ones.
 *
 * Since the split, there is a second way to be wrong: filing a line as a
 * cross-contact advisory when it is a direct declaration would soften a real
 * allergen into "may contain". Those cases are asserted hardest.
 *
 *   node --experimental-strip-types src/services/label-text.check.ts
 */
import assert from 'node:assert/strict';

import { extractIngredientSection } from './label-text.ts';

// drops brand, address, phone, nutrition — keeps the ingredient block
const korean = [
  '맛있는 초코쿠키',
  '주식회사 행복식품',
  '서울특별시 강남구 테헤란로 123',
  '고객상담실 080-123-4567',
  '원재료명: 밀가루(밀:미국산), 설탕, 전지분유(우유), 대두유',
  '내용량 100g',
  '영양성분 열량 500kcal',
];
const trimmed = extractIngredientSection(korean);
assert.deepEqual(trimmed.ingredients, ['원재료명: 밀가루(밀:미국산), 설탕, 전지분유(우유), 대두유']);
assert.deepEqual(trimmed.advisories, []);
assert.ok(!trimmed.ingredients.join(' ').includes('강남구'), 'address must be dropped');
assert.ok(!trimmed.ingredients.join(' ').includes('행복식품'), 'company name must be dropped');

// The Korean 알레르기 유발물질 line is a *direct* declaration — the law requires
// it because the allergen is in the product. It survives the trim, and it must
// stay with the ingredients rather than being demoted to a cross-contact note.
const withAdvisory = [
  '원재료명: 정제수, 설탕',
  '내용량 250ml',
  '알레르기 유발물질: 우유, 대두 함유',
];
const advisoryResult = extractIngredientSection(withAdvisory);
assert.deepEqual(advisoryResult.ingredients, [
  '원재료명: 정제수, 설탕',
  '알레르기 유발물질: 우유, 대두 함유',
]);
assert.deepEqual(advisoryResult.advisories, [], '"함유" is contains, not may-contain');

// English labels — "Contains:" is likewise a direct declaration
const english = [
  'Choco Cookies',
  'Ingredients: Wheat Flour, Sugar, Milk Powder, Soy Lecithin',
  'Contains: milk, soy, wheat',
  'Net Wt 100g',
  'Distributed by Happy Foods, 123 Main St',
];
const englishTrimmed = extractIngredientSection(english);
assert.ok(englishTrimmed.ingredients.some((l) => l.startsWith('Ingredients')));
assert.ok(englishTrimmed.ingredients.some((l) => l.startsWith('Contains')));
assert.deepEqual(englishTrimmed.advisories, []);
assert.ok(!englishTrimmed.ingredients.join(' ').includes('Main St'), 'address must be dropped');

// Japanese labels — 内容量 and 賞味期限 end the block just as their Korean twins do
const japanese = [
  'チョコクッキー',
  '株式会社しあわせ食品',
  '原材料名: 小麦粉、砂糖、全粉乳、大豆油',
  '内容量 100g',
  '賞味期限 2026.05.08',
  '製造者 しあわせ食品 東京都渋谷区1-2-3',
];
const japaneseTrimmed = extractIngredientSection(japanese);
assert.deepEqual(japaneseTrimmed.ingredients, ['原材料名: 小麦粉、砂糖、全粉乳、大豆油']);
assert.ok(!japaneseTrimmed.ingredients.join(' ').includes('渋谷区'), 'address must be dropped');

// 含みます is "contains" — direct, not precautionary
assert.deepEqual(
  extractIngredientSection(['原材料名: 水、砂糖', '内容量 250ml', '本品には乳成分・大豆を含みます']),
  { ingredients: ['原材料名: 水、砂糖', '本品には乳成分・大豆を含みます'], advisories: [] }
);

// Chinese labels — 配料 opens the block, 净含量 and 保质期 close it
const chinese = [
  '巧克力饼干',
  '上海幸福食品有限公司',
  '配料: 小麦粉、白砂糖、全脂奶粉、大豆油',
  '净含量 100克',
  '保质期 12个月',
  '地址: 上海市浦东新区某某路123号',
];
const chineseTrimmed = extractIngredientSection(chinese);
assert.deepEqual(chineseTrimmed.ingredients, ['配料: 小麦粉、白砂糖、全脂奶粉、大豆油']);
assert.ok(!chineseTrimmed.ingredients.join(' ').includes('浦东'), 'address must be dropped');

// 含有 is "contains" — direct
assert.deepEqual(
  extractIngredientSection(['配料表: 水、白砂糖', '淨含量 250毫升', '過敏原信息: 含有大豆、雞蛋']),
  { ingredients: ['配料表: 水、白砂糖', '過敏原信息: 含有大豆、雞蛋'], advisories: [] }
);

// Latin-script labels — Spanish and Italian ride on the English "ingredient",
// French needs its own accented form, German and Vietnamese their own words
const spanish = [
  'Galletas de chocolate',
  'Ingredientes: harina de trigo, azúcar, leche desnatada, aceite de soja',
  'Peso neto 100 g',
  'Información nutricional por 100 g',
  'Fabricado por Alimentos Felices, Calle Mayor 12, Madrid',
];
const spanishTrimmed = extractIngredientSection(spanish);
assert.deepEqual(spanishTrimmed.ingredients, [
  'Ingredientes: harina de trigo, azúcar, leche desnatada, aceite de soja',
]);
assert.ok(!spanishTrimmed.ingredients.join(' ').includes('Madrid'), 'address must be dropped');

assert.deepEqual(
  extractIngredientSection([
    'Biscotti',
    'Ingredienti: farina di grano, zucchero, latte',
    'Peso netto 100 g',
    'Da consumarsi preferibilmente entro il 05/2026',
  ]).ingredients,
  ['Ingredienti: farina di grano, zucchero, latte']
);

// "Ingrédients" would be missed by the English term — the accent breaks it
const french = [
  'Biscuits au chocolat',
  'Ingrédients: farine de blé, sucre, lait, oeuf',
  'Poids net 100 g',
  'À consommer de préférence avant le 05/2026',
  'Fabriqué par Aliments Heureux, 12 rue Principale, Paris',
];
const frenchTrimmed = extractIngredientSection(french);
assert.deepEqual(frenchTrimmed.ingredients, ['Ingrédients: farine de blé, sucre, lait, oeuf']);
assert.ok(!frenchTrimmed.ingredients.join(' ').includes('Paris'), 'address must be dropped');

// --- genuinely precautionary wording, in every language that has it ---------
//
// These are the lines that earn the amber verdict. Each one is a real
// cross-contact warning, so it must land in `advisories` and nowhere else.

// German "Kann Spuren von ... enthalten"
assert.deepEqual(
  extractIngredientSection([
    'Schokoladenkekse',
    'Zutaten: Weizenmehl, Zucker, Milch, Hühnerei',
    'Nettofüllmenge 100 g',
    'Mindestens haltbar bis 05/2026',
    'Kann Spuren von Erdnüssen enthalten',
  ]),
  {
    ingredients: ['Zutaten: Weizenmehl, Zucker, Milch, Hühnerei'],
    advisories: ['Kann Spuren von Erdnüssen enthalten'],
  }
);

// Vietnamese "có thể chứa"
assert.deepEqual(
  extractIngredientSection([
    'Bánh quy sô cô la',
    'Thành phần: bột mì, đường, sữa, trứng',
    'Khối lượng tịnh 100 g',
    'Hạn sử dụng 05/2026',
    'Sản phẩm có thể chứa đậu phộng',
  ]),
  {
    ingredients: ['Thành phần: bột mì, đường, sữa, trứng'],
    advisories: ['Sản phẩm có thể chứa đậu phộng'],
  }
);

// English "may contain"
assert.deepEqual(
  extractIngredientSection([
    'Ingredients: Sugar, Cocoa Butter',
    'Net Wt 50g',
    'May contain traces of peanuts and tree nuts',
  ]).advisories,
  ['May contain traces of peanuts and tree nuts']
);

// Japanese shared-line wording
assert.deepEqual(
  extractIngredientSection([
    '原材料名: 砂糖、カカオマス',
    '内容量 50g',
    '本製品は落花生と同一製造ラインで製造しています',
  ]).advisories,
  ['本製品は落花生と同一製造ラインで製造しています']
);

// Chinese 可能含有
assert.deepEqual(
  extractIngredientSection(['配料: 白砂糖、可可脂', '净含量 50克', '本产品可能含有微量花生']).advisories,
  ['本产品可能含有微量花生']
);

// Spanish "puede contener"
assert.deepEqual(
  extractIngredientSection([
    'Ingredientes: azúcar, manteca de cacao',
    'Peso neto 50 g',
    'Puede contener trazas de frutos secos',
  ]).advisories,
  ['Puede contener trazas de frutos secos']
);

// multi-line ingredient blocks stay whole
assert.deepEqual(
  extractIngredientSection(['원재료명', '밀가루, 설탕,', '전지분유(우유)', '유통기한 별도표기'])
    .ingredients,
  ['원재료명', '밀가루, 설탕,', '전지분유(우유)']
);

// Two notes, one before the ingredient block and one on the very line that
// ends it. Rescuing the first must not shift the "already kept" window past the
// second — dropping a line that names an allergen is the one unrecoverable bug.
// They also land on opposite sides of the split: 같은 시설 is precautionary,
// 알레르기 유발물질 ... 함유 is a direct declaration.
const twoAdvisories = extractIngredientSection([
  '본 제품은 대두를 함유한 제품과 같은 시설에서 제조',
  '맛있는 초코쿠키',
  '주식회사 행복식품',
  '원재료명: 밀가루, 설탕, 전지분유',
  '내용량 100g, 알레르기 유발물질: 우유 함유',
  '영양성분 열량 500kcal',
]);
assert.ok(
  twoAdvisories.ingredients.some((line) => line.includes('우유')),
  'a direct declaration on the block-terminating line must survive, as an ingredient'
);
assert.ok(
  twoAdvisories.advisories.some((line) => line.includes('대두')),
  'the precautionary note before the block must survive, as an advisory'
);
assert.ok(
  !twoAdvisories.ingredients.concat(twoAdvisories.advisories).join(' ').includes('영양성분'),
  'nutrition must still be dropped'
);

// fail open: no recognisable header means keep everything, as ingredients —
// the stronger verdict. Nothing may be demoted on a guess.
const unrecognised = ['설탕', '우유', '대두'];
assert.deepEqual(extractIngredientSection(unrecognised), {
  ingredients: unrecognised,
  advisories: [],
});
assert.deepEqual(extractIngredientSection(['본 제품은 우유와 같은 시설에서 제조']), {
  ingredients: ['본 제품은 우유와 같은 시설에서 제조'],
  advisories: [],
});
assert.deepEqual(extractIngredientSection([]), { ingredients: [], advisories: [] });

console.log('label-text: all checks passed');
