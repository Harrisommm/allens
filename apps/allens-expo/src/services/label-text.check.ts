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
