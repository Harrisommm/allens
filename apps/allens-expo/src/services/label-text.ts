/**
 * Starts the ingredient block.
 *
 * Spanish "ingredientes" and Italian "ingredienti" fall out of the English
 * term for free; French "ingrédients" does not, because the accent breaks the
 * substring — hence the explicit `ingr[ée]dients`.
 */
const SECTION_START =
  /원재료\s*명?|성분\s*명?|원료\s*명?|原材料\s*名?|配料\s*表?|原料\s*表?|ingredients?|ingr[ée]dients?|zutaten|thành\s*phần/i;

/**
 * Any other section on the package — where the ingredient block ends. Korean,
 * Japanese and Chinese spell several of these differently (내용량 vs 内容量 vs
 * 净含量), and Chinese labels come in both simplified and traditional, so every
 * form is listed.
 */
const SECTION_END =
  /내용량|중량|영양\s*성분|유통\s*기한|소비\s*기한|제조\s*원|제조\s*사|제조\s*일|판매\s*원|판매\s*자|수입\s*원|보관\s*방법|반품|교환|고객\s*상담|소비자\s*상담|품목\s*보고\s*번호|식품\s*유형|포장\s*재질|주소|전화|홈페이지|内容量|賞味期限|消費期限|製造者|製造所|販売者|保存方法|栄養成分|净含量|淨含量|保质期|保質期|生产日期|生產日期|贮存|儲存|储存|生产商|生產商|制造商|製造商|经销商|經銷商|营养成分|營養成分|产品标准|產品標準|地址|电话|電話|peso\s*neto|peso\s*netto|poids\s*net|nettofüllmenge|nettofuellmenge|khối\s*lượng\s*tịnh|información\s*nutricional|informacion\s*nutricional|valori\s*nutrizionali|valeurs\s*nutritionnelles|nährwert|naehrwert|consumir\s*preferentemente|da\s*consumarsi|à\s*consommer|a\s*consommer|mindestens\s*haltbar|hạn\s*sử\s*dụng|conservar|conservare|conserver|aufbewahren|bảo\s*quản|fabricado\s*por|prodotto\s*da|fabriqué\s*par|hergestellt|sản\s*xuất|nutrition|net\s*wt|calories|distributed\s*by|manufactured\s*by|best\s*before|expir|storage|customer\s*service/i;

/**
 * Allergen advisories that legally sit *outside* the ingredient list
 * ("알레르기 유발물질: 우유, 대두 함유", "本品には乳成分を含みます",
 * "过敏原信息: 含有牛奶、大豆", "Contains: milk").
 * These must survive the trim — they are often the only place an allergen is
 * named. Matching here only ever *keeps* a line, so broad terms are the safe
 * direction.
 */
const ALLERGEN_NOTE =
  /알레르기|알러지|유발\s*물질|함유|혼입|アレルギ|含みます|含む|一部に|过敏|過敏|致敏|含有|可能含|同一?生产线|同一?生產線|contains|may\s+contain|traces|contiene|puede\s*contener|può\s*contenere|puo\s*contenere|contient|peut\s*contenir|enthält|enthaelt|kann\s*spuren|allergen|alérgen|allerge|dị\s*ứng|chứa|có\s*thể\s*chứa/i;

/**
 * *Precautionary* wording only — "may contain", "traces of", "made on the same
 * line". An allergen named on one of these is a cross-contact risk rather than
 * something the product is known to contain.
 *
 * Deliberately much narrower than ALLERGEN_NOTE. Korean "알레르기 유발물질:
 * 우유 함유", Japanese "本品には乳成分を含みます" and English "Contains: milk"
 * are *direct* declarations — the law requires them precisely because the
 * allergen is in the product — so they are absent here and stay with the
 * ingredients. Only wording explicitly about possible contamination demotes a
 * line; anything unrecognised keeps the stronger verdict.
 */
const PRECAUTIONARY =
  /혼입|(같은|동일)\s*(시설|공장|제조\s*시설|생산\s*라인|라인)|混入|同一(製造)?ライン|同じ(製造)?ライン|同一設備|同一工場|可能含有?|同一?\s*(生产线|生產線|车间|車間)|may\s+contain|traces|shared\s+(equipment|facility|line)|puede\s*contener|trazas|può\s*contenere|puo\s*contenere|tracce|peut\s*contenir|kann\s*spuren|spuren\s*von|có\s*thể\s*chứa/i;

export type LabelSections = {
  /** The ingredient block. An allergen named here is *in* the product. */
  ingredients: string[];
  /** Cross-contact warnings. An allergen named only here is a *risk*, not a fact. */
  advisories: string[];
};

/**
 * Splits the label into the ingredient block and any cross-contact advisory,
 * dropping the rest of the package text (brand, address, phone, nutrition).
 *
 * Fails open twice over, because a wrong trim can hide an allergen and a wrong
 * demotion can soften a real one:
 *  - no recognised ingredient header ⇒ every line is kept, as ingredients;
 *  - a kept line that isn't explicitly precautionary ⇒ ingredients.
 * Ambiguity always resolves toward the stronger verdict.
 */
export function extractIngredientSection(lines: string[]): LabelSections {
  const start = lines.findIndex((line) => SECTION_START.test(line));
  if (start === -1) return { ingredients: lines, advisories: [] };

  const ingredients: string[] = [];
  for (let i = start; i < lines.length; i += 1) {
    // A later section header ends the block — unless that same line also
    // restates the ingredient header, which real labels do.
    if (i > start && SECTION_END.test(lines[i]) && !SECTION_START.test(lines[i])) break;
    ingredients.push(lines[i]);
  }

  // Advisories can appear anywhere on the package, including after the cut.
  // Fix the block's end *before* rescuing any: each push grows `ingredients`, so
  // reading its length inside the loop would walk the boundary forward and skip
  // a line.
  const blockEnd = start + ingredients.length;
  const advisories: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (i >= start && i < blockEnd) continue;
    // Either gate rescues the line. PRECAUTIONARY has to count on its own:
    // some shared-line wording ("同一製造ラインで製造しています") names no
    // allergen keyword at all, and was silently dropped when ALLERGEN_NOTE was
    // the only way in.
    const precautionary = PRECAUTIONARY.test(lines[i]);
    if (!precautionary && !ALLERGEN_NOTE.test(lines[i])) continue;
    (precautionary ? advisories : ingredients).push(lines[i]);
  }

  return { ingredients, advisories };
}
