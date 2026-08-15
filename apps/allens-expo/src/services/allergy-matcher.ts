export type Allergen = {
  /** Display name, e.g. "Tree nut". */
  name: string;
  /** Every spelling that means this allergen, in any language the label might use. */
  aliases: string[];
};

/**
 * Aliases cover every language the app can scan — English, Korean, Japanese,
 * Chinese (simplified and traditional, since a label prints only one of them) —
 * because these are matched against the *raw OCR text*, before and independently
 * of any translation. That is what makes the danger flag work with no API key,
 * no network and no language detection: a failed translation can never turn a
 * risky label green. Matching is plain substring search, so adding a language is
 * only ever adding spellings here.
 *
 * Lives in this module, not in the store, so the self-check can exercise the
 * real table rather than a copy of it.
 *
 * Add spellings freely. An extra alias only ever makes the app more cautious,
 * and some deliberately overreach (Japanese 麦 "wheat/barley" also appears in
 * 蕎麦 "buckwheat"; ナッツ "nut" also appears in ピーナッツ "peanut"; Chinese 奶
 * "milk" also appears in 豆奶 "soy milk", and 蛋白 "egg white" in 蛋白质
 * "protein") — flagging a neighbouring allergen is the safe direction.
 */
export const PRESET_ALLERGENS: Allergen[] = [
  { name: 'Milk', aliases: ['milk', 'dairy', 'butter', 'cheese', 'cream', 'whey', 'casein', 'lactose', '우유', '유당', '유청', '치즈', '버터', '크림', '분유', '乳', 'ミルク', 'バター', 'チーズ', 'クリーム', 'ホエイ', 'カゼイン', '奶', '黄油', '奶酪', '芝士', '乳清', '酪蛋白', '乳糖'] },
  { name: 'Egg', aliases: ['egg', 'albumin', '계란', '달걀', '난백', '난황', '卵', '玉子', 'たまご', 'エッグ', 'アルブミン', '蛋', '蛋白', '蛋黄', '蛋黃'] },
  { name: 'Peanut', aliases: ['peanut', 'groundnut', '땅콩', '落花生', 'ピーナッツ', 'ピーナツ', '花生'] },
  { name: 'Tree nut', aliases: ['almond', 'walnut', 'cashew', 'hazelnut', 'pecan', 'pistachio', 'macadamia', '아몬드', '호두', '캐슈', '헤이즐넛', '피스타치오', '잣', 'ナッツ', 'くるみ', 'クルミ', '胡桃', 'アーモンド', 'カシュー', 'ヘーゼル', 'ピスタチオ', 'マカダミア', '坚果', '堅果', '杏仁', '核桃', '腰果', '榛子', '开心果', '開心果', '碧根果', '夏威夷果', '松子'] },
  { name: 'Soy', aliases: ['soy', 'soya', 'soybean', 'tofu', 'edamame', '대두', '두부', '간장', '된장', '大豆', 'だいず', 'ダイズ', '豆腐', '豆乳', '醤油', 'しょうゆ', '味噌', 'みそ', '枝豆', '黄豆', '黃豆', '豆浆', '豆漿', '酱油', '醬油', '豆制品', '豆製品', '毛豆'] },
  { name: 'Wheat', aliases: ['wheat', 'gluten', 'flour', 'barley', 'rye', '밀', '밀가루', '글루텐', '보리', '호밀', '麦', 'こむぎ', 'グルテン', '麥', '面粉', '麵粉', '面筋', '麵筋', '麸质', '麩質', '麸皮'] },
  { name: 'Shellfish', aliases: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'oyster', 'clam', 'mussel', '새우', '게', '랍스터', '조개', '굴', '홍합', 'えび', 'エビ', '海老', 'かに', 'カニ', '蟹', '甲殻類', 'ロブスター', '貝', '牡蠣', 'カキ', 'あさり', '虾', '蝦', '贝', '牡蛎', '蛤', '甲壳', '甲殼'] },
  { name: 'Fish', aliases: ['fish', 'anchovy', 'tuna', 'salmon', 'cod', '생선', '멸치', '참치', '연어', '어육', '魚', 'さかな', '鮭', 'サーモン', '鮪', 'マグロ', '鰹', 'カツオ', 'いわし', 'アンチョビ', '鱼', '鳀', '鲑', '鳕', '金枪', '三文'] },
  { name: 'Sesame', aliases: ['sesame', 'tahini', '참깨', '깨', '참기름', 'ごま', 'ゴマ', '胡麻', 'セサミ', '芝麻', '麻油'] },
  { name: 'Buckwheat', aliases: ['buckwheat', '메밀', 'そば', 'ソバ', '蕎麦', '荞麦', '蕎麥'] },
  { name: 'Pork', aliases: ['pork', 'bacon', 'lard', '돼지고기', '돈육', '豚', 'ぶた', 'ポーク', 'ベーコン', 'ラード', '猪', '豬', '培根', '火腿'] },
  { name: 'Sulfites', aliases: ['sulfite', 'sulphite', 'aspartame', '아황산', '亜硫酸', '二酸化硫黄', 'アスパルテーム', '亚硫酸', '亞硫酸', '二氧化硫', '阿斯巴甜'] },
];

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
 * The verdict for one scan: both readings of the label are searched, because a
 * translation can drop a term the original names, and vice versa.
 *
 * Lives here rather than in the screens that show the badge so the self-check
 * exercises the real safety path instead of a re-typed copy of it.
 */
export function scanAllergenNames(
  scan: { originalText: string; translatedText: string },
  allergens: Allergen[]
): string[] {
  return matchedAllergenNames([
    ...findAllergenMatches(scan.translatedText, allergens),
    ...findAllergenMatches(scan.originalText, allergens),
  ]);
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
