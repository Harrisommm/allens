export type Allergen = {
  /** Display name, e.g. "Tree nut". */
  name: string;
  /** Every spelling that means this allergen, in any language the label might use. */
  aliases: string[];
};

/**
 * Aliases cover every language the app can scan, because they are matched
 * against the *raw OCR text*, before and independently of any translation. That
 * is what makes the danger flag work with no API key, no network and no
 * language detection: a failed translation can never turn a risky label green.
 * Matching is plain substring search, so adding a language is only ever adding
 * spellings here.
 *
 * Lives in this module, not in the store, so the self-check can exercise the
 * real table rather than a copy of it.
 *
 * Each entry lists its spellings in a fixed order — en · ko · ja · zh · es · it
 * · fr · de · vi, one line per language — so a missing language is visible at a
 * glance rather than buried in a long row. Chinese carries both simplified and
 * traditional forms, since a label prints only one of them.
 *
 * ## Two rules, learned the hard way
 *
 * **Overreach is fine per term.** Japanese 麦 "wheat/barley" also appears in
 * 蕎麦 "buckwheat"; ナッツ "nut" in ピーナッツ "peanut"; Chinese 奶 "milk" in
 * 豆奶 "soy milk"; 雞 "chicken" in 雞蛋 "egg"; English "apple" in "pineapple".
 * Flagging a neighbouring allergen is the safe direction.
 *
 * **Overreach is not fine in aggregate.** An alias that fires on most labels in
 * its language trains the user to ignore the badge, which is a safety failure
 * with extra steps. This is why Vietnamese has no bare `cá` "fish" (it sits
 * inside `các` and `cách`, two of the commonest words in the language) and
 * German no bare `Ei` "egg" (inside `Protein`, `Eis`, `beige`). Use the longer
 * form — `cá hồi`, `Hühnerei` — and accept the rare miss on a bare mention.
 *
 * Practical floor: **no Latin-script alias shorter than three characters**.
 * The self-check enforces it, because the failure is invisible until a real
 * label turns everything red.
 */
export const PRESET_ALLERGENS: Allergen[] = [
  {
    name: 'Milk',
    aliases: [
      'milk', 'dairy', 'butter', 'cheese', 'cream', 'whey', 'casein', 'lactose', 'yogurt', 'yoghurt', 'ghee',
      '우유', '유당', '유청', '치즈', '버터', '크림', '분유', '카제인', '연유', '유고형분', '발효유', '락토스', '유단백', '탈지유', '요구르트',
      '乳', 'ミルク', 'バター', 'チーズ', 'クリーム', 'ホエイ', 'カゼイン', '練乳', 'ヨーグルト',
      '奶', '黄油', '奶酪', '芝士', '乳清', '酪蛋白', '乳糖', '炼乳', '煉乳',
      'leche', 'mantequilla', 'queso', 'nata', 'crema', 'suero', 'caseína', 'caseina', 'lactosa', 'yogur',
      'latte', 'burro', 'formaggio', 'panna', 'siero', 'lattosio',
      'lait', 'beurre', 'fromage', 'crème', 'creme', 'caséine', 'yaourt',
      'milch', 'käse', 'kaese', 'sahne', 'molke', 'kasein', 'laktose', 'joghurt', 'rahm',
      'sữa', 'phô mai', 'pho mai', 'bơ sữa',
    ],
  },
  {
    name: 'Egg',
    aliases: [
      'egg', 'albumin', 'albumen', 'lysozyme', 'mayonnaise', 'meringue',
      '계란', '달걀', '난백', '난황', '알부민', '전란', '난분', '리소자임', '마요네즈',
      '卵', '玉子', 'たまご', 'エッグ', 'アルブミン', '全卵', 'リゾチーム', 'マヨネーズ',
      '蛋', '蛋白', '蛋黄', '蛋黃', '全蛋', '蛋粉', '溶菌酶',
      'huevo', 'albúmina', 'albumina', 'mayonesa', 'ovoproducto',
      'uovo', 'uova', 'albume', 'maionese',
      'oeuf', 'œuf', 'oeufs', 'albumine', 'lysozyme',
      'hühnerei', 'huehnerei', 'eigelb', 'eiweiß', 'eiweiss', 'eiklar', 'volleipulver', 'eipulver',
      'trứng',
    ],
  },
  {
    name: 'Peanut',
    aliases: [
      'peanut', 'groundnut', 'arachis',
      '땅콩', '낙화생',
      '落花生', 'ピーナッツ', 'ピーナツ',
      '花生',
      'cacahuete', 'cacahuate', 'maní', 'mani',
      'arachide', 'arachidi',
      'cacahuète',
      'erdnuss', 'erdnüsse', 'erdnuesse',
      'đậu phộng', 'lạc',
    ],
  },
  {
    name: 'Tree nut',
    aliases: [
      'almond', 'walnut', 'cashew', 'hazelnut', 'pecan', 'pistachio', 'macadamia', 'chestnut', 'pine nut',
      '아몬드', '호두', '캐슈', '헤이즐넛', '피스타치오', '잣', '마카다미아', '브라질너트', '너트',
      'ナッツ', 'くるみ', 'クルミ', '胡桃', 'アーモンド', 'カシュー', 'ヘーゼル', 'ピスタチオ', 'マカダミア', '松の実',
      '坚果', '堅果', '杏仁', '核桃', '腰果', '榛子', '开心果', '開心果', '碧根果', '夏威夷果', '松子',
      'almendra', 'nuez', 'nueces', 'avellana', 'anacardo', 'pistacho', 'castaña',
      'mandorla', 'noci', 'noce', 'nocciola', 'anacardi', 'pistacchio',
      'amande', 'noix', 'noisette', 'cajou', 'pistache',
      'mandel', 'walnuss', 'haselnuss', 'pistazie', 'nuss', 'nüsse', 'nuesse', 'paranuss',
      'hạt điều', 'óc chó', 'hạnh nhân', 'hạt dẻ', 'hồ đào',
    ],
  },
  {
    name: 'Soy',
    aliases: [
      'soy', 'soya', 'soybean', 'tofu', 'edamame', 'miso', 'tempeh',
      '대두', '두부', '간장', '된장', '분리대두단백', '식물성단백', '콩기름', '콩단백',
      '大豆', 'だいず', 'ダイズ', '豆腐', '豆乳', '醤油', 'しょうゆ', '味噌', 'みそ', '枝豆', '分離大豆',
      '黄豆', '黃豆', '豆浆', '豆漿', '酱油', '醬油', '豆制品', '豆製品', '毛豆',
      'soja', 'soya',
      'soia',
      'đậu nành', 'đậu tương', 'đậu phụ', 'nước tương',
    ],
  },
  {
    name: 'Wheat',
    aliases: [
      'wheat', 'gluten', 'flour', 'barley', 'rye', 'spelt', 'semolina', 'malt', 'seitan',
      '밀', '밀가루', '글루텐', '보리', '호밀', '소맥', '소맥분', '소맥전분', '밀단백', '맥아', '듀럼', '세몰리나',
      '麦', 'こむぎ', 'グルテン', '麦芽',
      '麥', '面粉', '麵粉', '面筋', '麵筋', '麸质', '麩質', '麸皮',
      'trigo', 'harina', 'cebada', 'centeno', 'sémola', 'semola', 'espelta',
      'grano', 'farina', 'glutine', 'orzo', 'segale', 'frumento',
      'blé', 'ble', 'farine', 'orge', 'seigle', 'semoule', 'épeautre', 'epeautre',
      'weizen', 'mehl', 'gerste', 'roggen', 'dinkel', 'grieß', 'griess', 'malz',
      'lúa mì', 'bột mì', 'lúa mạch', 'mạch nha',
    ],
  },
  {
    name: 'Shellfish',
    aliases: [
      'shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'oyster', 'clam', 'mussel', 'scallop', 'abalone', 'krill',
      '새우', '게', '랍스터', '조개', '굴', '홍합', '전복', '가리비', '바지락', '크릴',
      'えび', 'エビ', '海老', 'かに', 'カニ', '蟹', '甲殻類', 'ロブスター', '貝', '牡蠣', 'カキ', 'あさり', 'ほたて', 'あわび',
      '虾', '蝦', '贝', '牡蛎', '蛤', '甲壳', '甲殼', '鲍鱼', '鮑魚', '扇贝', '扇貝',
      'gamba', 'camarón', 'camaron', 'langostino', 'cangrejo', 'langosta', 'marisco', 'ostra', 'almeja', 'mejillón', 'mejillon', 'vieira',
      'gambero', 'gamberetto', 'granchio', 'aragosta', 'crostacei', 'ostrica', 'vongole', 'cozze', 'capesante',
      'crevette', 'crabe', 'homard', 'langoustine', 'crustacé', 'crustace', 'huître', 'huitre', 'palourde', 'moule', 'coquille',
      'garnele', 'krabbe', 'hummer', 'krebstier', 'schalentier', 'auster', 'muschel',
      'tôm', 'cua', 'nghêu', 'hàu', 'hải sản',
    ],
  },
  {
    name: 'Fish',
    aliases: [
      'fish', 'anchovy', 'tuna', 'salmon', 'cod', 'mackerel', 'sardine', 'herring', 'pollock', 'bonito',
      '생선', '멸치', '참치', '연어', '어육', '액젓', '어간장', '가다랑어', '고등어', '명태', '황태', '어분', '젓갈',
      '魚', 'さかな', '鮭', 'サーモン', '鮪', 'マグロ', '鰹', 'カツオ', 'いわし', 'アンチョビ', '魚醤', 'さば', '鯖', 'たら',
      '鱼', '鳀', '鲑', '鳕', '金枪', '三文', '鱼露', '鲭',
      'pescado', 'atún', 'atun', 'salmón', 'anchoa', 'bacalao', 'sardina', 'caballa', 'merluza',
      'pesce', 'tonno', 'salmone', 'acciughe', 'merluzzo', 'sgombro',
      'poisson', 'thon', 'saumon', 'anchois', 'cabillaud', 'maquereau', 'morue',
      'fisch', 'thunfisch', 'lachs', 'sardelle', 'kabeljau', 'makrele', 'hering',
      'cá hồi', 'cá ngừ', 'cá cơm', 'cá thu', 'cá basa', 'nước mắm', 'bột cá',
    ],
  },
  {
    name: 'Sesame',
    aliases: [
      'sesame', 'tahini',
      '참깨', '깨', '참기름', '검은깨',
      'ごま', 'ゴマ', '胡麻', 'セサミ',
      '芝麻', '麻油',
      'sésamo', 'sesamo', 'ajonjolí', 'ajonjoli',
      'tahina',
      'sésame',
      'sesam', 'tahin',
      'vừng', 'hạt mè', 'dầu mè', 'mè đen',
    ],
  },
  {
    name: 'Buckwheat',
    aliases: [
      'buckwheat', 'soba',
      '메밀',
      'そば', 'ソバ', '蕎麦',
      '荞麦', '蕎麥',
      'alforfón', 'alforfon', 'trigo sarraceno',
      'grano saraceno',
      'sarrasin',
      'buchweizen',
      'kiều mạch',
    ],
  },
  {
    name: 'Pork',
    aliases: [
      'pork', 'bacon', 'lard', 'ham', 'prosciutto',
      '돼지고기', '돈육', '돼지', '베이컨', '라드',
      '豚', 'ぶた', 'ポーク', 'ベーコン', 'ラード', 'ハム',
      '猪', '豬', '培根', '火腿',
      'cerdo', 'tocino', 'jamón', 'jamon', 'manteca', 'panceta',
      'maiale', 'pancetta', 'lardo', 'suino',
      'porc', 'jambon', 'saindoux',
      'schwein', 'speck', 'schinken', 'schmalz',
      'thịt lợn', 'thịt heo', 'giăm bông', 'mỡ lợn',
    ],
  },
  {
    name: 'Sulfites',
    aliases: [
      'sulfite', 'sulphite', 'sulfur dioxide', 'aspartame',
      '아황산', '이산화황', '아스파탐',
      '亜硫酸', '二酸化硫黄', 'アスパルテーム',
      '亚硫酸', '亞硫酸', '二氧化硫', '阿斯巴甜',
      'sulfito', 'azufre', 'aspartamo',
      'solfito', 'solfiti', 'solforosa',
      'sulfureux', 'sulfites',
      'sulfit', 'schwefeldioxid', 'aspartam',
      'lưu huỳnh',
    ],
  },
  {
    name: 'Celery',
    aliases: [
      'celery', 'celeriac',
      '셀러리',
      'セロリ',
      '芹菜', '西芹',
      'apio',
      'sedano',
      'céleri', 'celeri',
      'sellerie',
      'cần tây',
    ],
  },
  {
    name: 'Mustard',
    aliases: [
      'mustard',
      '겨자', '머스타드', '머스터드',
      'からし', 'カラシ', '芥子', 'マスタード',
      '芥末', '芥菜',
      'mostaza',
      'senape',
      'moutarde',
      'senf',
      'mù tạt',
    ],
  },
  {
    name: 'Lupin',
    aliases: [
      'lupin', 'lupine',
      '루핀',
      'ルピナス',
      '羽扇豆',
      'altramuz', 'lupino',
      'lupini',
      'lupin',
      'lupine',
      'đậu lupin',
    ],
  },
  {
    name: 'Squid',
    aliases: [
      'squid', 'calamari', 'cuttlefish', 'octopus',
      '오징어', '문어', '낙지', '한치',
      'いか', 'イカ', '烏賊', 'たこ', 'タコ',
      '鱿鱼', '魷魚', '墨鱼', '墨魚', '章鱼', '章魚',
      'calamar', 'sepia', 'pulpo',
      'calamaro', 'seppia', 'polpo',
      'calmar', 'seiche', 'poulpe', 'encornet',
      'tintenfisch', 'kalmar', 'oktopus',
      'mực', 'bạch tuộc',
    ],
  },
  {
    name: 'Peach',
    aliases: [
      'peach', 'nectarine',
      '복숭아',
      '桃', 'ピーチ',
      '桃子', '水蜜桃', '黄桃',
      'melocotón', 'melocoton', 'durazno',
      'pesca', 'pesche',
      'pêche', 'peche',
      'pfirsich',
      'đào',
    ],
  },
  {
    name: 'Tomato',
    aliases: [
      'tomato',
      '토마토',
      'トマト',
      '番茄', '西红柿', '西紅柿',
      'tomate',
      'pomodoro',
      'tomate',
      'tomate',
      'cà chua',
    ],
  },
  {
    name: 'Chicken',
    aliases: [
      'chicken', 'poultry',
      '닭고기', '닭', '계육',
      '鶏', 'とり肉', 'チキン',
      '鸡', '雞',
      'pollo', 'gallina',
      'pollo',
      'poulet', 'volaille',
      'hähnchen', 'haehnchen', 'huhn', 'geflügel', 'gefluegel',
      'thịt gà',
    ],
  },
  {
    name: 'Beef',
    aliases: [
      'beef', 'tallow',
      '쇠고기', '소고기', '우육',
      '牛肉', 'ビーフ',
      '牛肉粉',
      'ternera', 'vacuno', 'buey',
      'manzo', 'bovino', 'vitello',
      'boeuf', 'bœuf', 'bovin',
      'rindfleisch', 'rind',
      'thịt bò', 'bò viên',
    ],
  },
  {
    name: 'Gelatin',
    aliases: [
      'gelatin', 'gelatine', 'collagen',
      '젤라틴', '콜라겐',
      'ゼラチン', 'コラーゲン',
      '明胶', '明膠', '吉利丁', '胶原', '膠原',
      'gelatina', 'colágeno', 'colageno',
      'collagene',
      'gélatine', 'collagène',
      'kollagen',
      'gelatin',
    ],
  },
  {
    name: 'Apple',
    aliases: [
      'apple',
      '사과',
      'りんご', 'リンゴ', '林檎', 'アップル',
      '苹果', '蘋果',
      'manzana',
      'mela', 'mele',
      'pomme',
      'apfel', 'äpfel', 'aepfel',
      'táo',
    ],
  },
  {
    name: 'Banana',
    aliases: [
      'banana',
      '바나나',
      'バナナ',
      '香蕉', '芭蕉',
      'plátano', 'platano',
      'banana',
      'banane',
      'banane',
      'chuối',
    ],
  },
  {
    name: 'Kiwi',
    aliases: [
      'kiwi',
      '키위', '참다래',
      'キウイ',
      '猕猴桃', '獼猴桃', '奇异果', '奇異果',
      'kiwi',
      'kiwi',
      'kiwi',
      'kiwi',
      'kiwi',
    ],
  },
  {
    name: 'Orange',
    aliases: [
      'orange', 'citrus', 'mandarin', 'tangerine',
      '오렌지', '감귤', '귤',
      'オレンジ', 'みかん', '蜜柑', '柑橘',
      '橙', '橘', '柳橙',
      // no 'cítrico': "ácido cítrico" (citric acid) is on nearly every label
      'naranja', 'mandarina',
      'arancia', 'arance', 'mandarino', 'agrumi',
      'mandarine', 'agrume',
      'zitrus',
      'cam', 'quýt',
    ],
  },
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
