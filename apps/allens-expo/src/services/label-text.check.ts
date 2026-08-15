/**
 * Self-check for ingredient-section extraction. Trimming a label wrongly can
 * hide an allergen, so the "keeps things it shouldn't drop" cases matter more
 * than the tidy ones.
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
assert.deepEqual(trimmed, ['원재료명: 밀가루(밀:미국산), 설탕, 전지분유(우유), 대두유']);
assert.ok(!trimmed.join(' ').includes('강남구'), 'address must be dropped');
assert.ok(!trimmed.join(' ').includes('행복식품'), 'company name must be dropped');

// the allergen advisory survives even though it sits past the section end
const withAdvisory = [
  '원재료명: 정제수, 설탕',
  '내용량 250ml',
  '알레르기 유발물질: 우유, 대두 함유',
];
assert.deepEqual(extractIngredientSection(withAdvisory), [
  '원재료명: 정제수, 설탕',
  '알레르기 유발물질: 우유, 대두 함유',
]);

// English labels
const english = [
  'Choco Cookies',
  'Ingredients: Wheat Flour, Sugar, Milk Powder, Soy Lecithin',
  'Contains: milk, soy, wheat',
  'Net Wt 100g',
  'Distributed by Happy Foods, 123 Main St',
];
const englishTrimmed = extractIngredientSection(english);
assert.ok(englishTrimmed.some((l) => l.startsWith('Ingredients')));
assert.ok(englishTrimmed.some((l) => l.startsWith('Contains')));
assert.ok(!englishTrimmed.join(' ').includes('Main St'), 'address must be dropped');

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
assert.deepEqual(japaneseTrimmed, ['原材料名: 小麦粉、砂糖、全粉乳、大豆油']);
assert.ok(!japaneseTrimmed.join(' ').includes('渋谷区'), 'address must be dropped');

// the Japanese advisory survives even though it sits past the section end
assert.deepEqual(
  extractIngredientSection(['原材料名: 水、砂糖', '内容量 250ml', '本品には乳成分・大豆を含みます']),
  ['原材料名: 水、砂糖', '本品には乳成分・大豆を含みます']
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
assert.deepEqual(chineseTrimmed, ['配料: 小麦粉、白砂糖、全脂奶粉、大豆油']);
assert.ok(!chineseTrimmed.join(' ').includes('浦东'), 'address must be dropped');

// the Chinese advisory survives even though it sits past the section end
assert.deepEqual(
  extractIngredientSection(['配料表: 水、白砂糖', '淨含量 250毫升', '過敏原信息: 含有大豆、雞蛋']),
  ['配料表: 水、白砂糖', '過敏原信息: 含有大豆、雞蛋']
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
assert.deepEqual(spanishTrimmed, [
  'Ingredientes: harina de trigo, azúcar, leche desnatada, aceite de soja',
]);
assert.ok(!spanishTrimmed.join(' ').includes('Madrid'), 'address must be dropped');

assert.deepEqual(
  extractIngredientSection([
    'Biscotti',
    'Ingredienti: farina di grano, zucchero, latte',
    'Peso netto 100 g',
    'Da consumarsi preferibilmente entro il 05/2026',
  ]),
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
assert.deepEqual(frenchTrimmed, ['Ingrédients: farine de blé, sucre, lait, oeuf']);
assert.ok(!frenchTrimmed.join(' ').includes('Paris'), 'address must be dropped');

assert.deepEqual(
  extractIngredientSection([
    'Schokoladenkekse',
    'Zutaten: Weizenmehl, Zucker, Milch, Hühnerei',
    'Nettofüllmenge 100 g',
    'Mindestens haltbar bis 05/2026',
    'Kann Spuren von Erdnüssen enthalten',
  ]),
  ['Zutaten: Weizenmehl, Zucker, Milch, Hühnerei', 'Kann Spuren von Erdnüssen enthalten']
);

assert.deepEqual(
  extractIngredientSection([
    'Bánh quy sô cô la',
    'Thành phần: bột mì, đường, sữa, trứng',
    'Khối lượng tịnh 100 g',
    'Hạn sử dụng 05/2026',
    'Sản phẩm có thể chứa đậu phộng',
  ]),
  ['Thành phần: bột mì, đường, sữa, trứng', 'Sản phẩm có thể chứa đậu phộng']
);

// multi-line ingredient blocks stay whole
assert.deepEqual(
  extractIngredientSection(['원재료명', '밀가루, 설탕,', '전지분유(우유)', '유통기한 별도표기']),
  ['원재료명', '밀가루, 설탕,', '전지분유(우유)']
);

// fail open: no recognisable header means keep everything
const unrecognised = ['설탕', '우유', '대두'];
assert.deepEqual(extractIngredientSection(unrecognised), unrecognised);
assert.deepEqual(extractIngredientSection([]), []);

console.log('label-text: all checks passed');
