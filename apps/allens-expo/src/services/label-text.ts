/** Starts the ingredient block. */
const SECTION_START = /원재료\s*명?|성분\s*명?|원료\s*명?|原材料\s*名?|ingredients?/i;

/**
 * Any other section on the package — where the ingredient block ends. Korean
 * and Japanese spell several of these differently (내용량 vs 内容量), so both
 * forms are listed.
 */
const SECTION_END =
  /내용량|중량|영양\s*성분|유통\s*기한|소비\s*기한|제조\s*원|제조\s*사|제조\s*일|판매\s*원|판매\s*자|수입\s*원|보관\s*방법|반품|교환|고객\s*상담|소비자\s*상담|품목\s*보고\s*번호|식품\s*유형|포장\s*재질|주소|전화|홈페이지|内容量|賞味期限|消費期限|製造者|製造所|販売者|保存方法|栄養成分|nutrition|net\s*wt|calories|distributed\s*by|manufactured\s*by|best\s*before|expir|storage|customer\s*service/i;

/**
 * Allergen advisories that legally sit *outside* the ingredient list
 * ("알레르기 유발물질: 우유, 대두 함유", "本品には乳成分を含みます", "Contains: milk").
 * These must survive the trim — they are often the only place an allergen is
 * named. Matching here only ever *keeps* a line, so broad terms are the safe
 * direction.
 */
const ALLERGEN_NOTE =
  /알레르기|알러지|유발\s*물질|함유|혼입|アレルギ|含みます|含む|一部に|contains|may\s+contain/i;

/**
 * Keeps the ingredient block plus any allergen advisory, and drops the rest of
 * the package text (brand, address, phone number, nutrition table).
 *
 * Fails open: if no ingredient header is recognised, every line is kept. An
 * over-inclusive scan is merely noisy, while a wrongly trimmed one can hide an
 * allergen — so ambiguity always resolves toward keeping text.
 */
export function extractIngredientSection(lines: string[]): string[] {
  const start = lines.findIndex((line) => SECTION_START.test(line));
  if (start === -1) return lines;

  const kept: string[] = [];
  for (let i = start; i < lines.length; i += 1) {
    // A later section header ends the block — unless that same line also
    // restates the ingredient header, which real labels do.
    if (i > start && SECTION_END.test(lines[i]) && !SECTION_START.test(lines[i])) break;
    kept.push(lines[i]);
  }

  // Advisories can appear anywhere on the package, including after the cut.
  for (let i = 0; i < lines.length; i += 1) {
    if ((i < start || i >= start + kept.length) && ALLERGEN_NOTE.test(lines[i])) {
      kept.push(lines[i]);
    }
  }

  return kept;
}
