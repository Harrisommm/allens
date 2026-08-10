/**
 * Self-check for ingredient-section extraction. Trimming a label wrongly can
 * hide an allergen, so the "keeps things it shouldn't drop" cases matter more
 * than the tidy ones.
 *
 *   node --experimental-strip-types src/services/label-text.check.ts
 */
import assert from 'node:assert/strict';

import { extractIngredientSection, extractProductName } from './label-text.ts';

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

// multi-line ingredient blocks stay whole
assert.deepEqual(
  extractIngredientSection(['원재료명', '밀가루, 설탕,', '전지분유(우유)', '유통기한 별도표기']),
  ['원재료명', '밀가루, 설탕,', '전지분유(우유)']
);

// fail open: no recognisable header means keep everything
const unrecognised = ['설탕', '우유', '대두'];
assert.deepEqual(extractIngredientSection(unrecognised), unrecognised);
assert.deepEqual(extractIngredientSection([]), []);

// --- product name ---------------------------------------------------------

// the printed product name, not the ingredient header
assert.equal(extractProductName(korean), '맛있는 초코쿠키');
assert.equal(extractProductName(english), 'Choco Cookies');
assert.equal(extractProductName(japanese), 'チョコクッキー');

// weights, barcodes, dates and phone numbers are not names
assert.equal(
  extractProductName(['8801234567890', '250ml', '2026.05.08', '순수 우유', '원재료명: 우유']),
  '순수 우유'
);

// section headers and advisories are never the name
assert.equal(extractProductName(['원재료명: 우유, 설탕']), undefined);
assert.equal(extractProductName(['Contains: milk']), undefined);

// an ingredients-only photo has no product name in frame. The search stops at
// the first section header rather than walking into the list and titling the
// scan with its first ingredient.
assert.equal(
  extractProductName(['원재료명: 밀가루, 설탕, 전지분유(우유)', '알레르기 유발물질: 우유 함유']),
  undefined
);
assert.equal(extractProductName(['原材料名: 小麦粉、砂糖', '内容量 100g']), undefined);
assert.equal(extractProductName(['Ingredients: Wheat Flour, Sugar', 'Net Wt 100g']), undefined);

// nothing name-like -> undefined, so the caller can fall back to the scan date
assert.equal(extractProductName(['100g', '8801234567890']), undefined);
assert.equal(extractProductName([]), undefined);

// long names are truncated for the history list
assert.equal(extractProductName(['가'.repeat(80)]).length, 60);

console.log('label-text: all checks passed');
