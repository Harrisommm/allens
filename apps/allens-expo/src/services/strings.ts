/**
 * UI copy in English, Korean and Japanese.
 *
 * No i18n library: forty strings and three languages do not need a runtime,
 * a loader or a plural engine. `en` is the source of truth — `ko` and `ja` are
 * typed against it, so a missing or misspelled key is a typecheck error rather
 * than a blank label discovered on a phone.
 *
 * Tone is deliberately terse: 스캔, 추가, 삭제 — noun-style labels, no 하세요
 * endings. A safety app is read at a glance in a shop aisle, not settled into.
 *
 * This module stays free of `expo-localization` (the language is passed in) so
 * the self-check can import it under plain node. `uiLanguage()` in
 * translation.ts is what reads the device.
 */
export type UiLanguage = 'en' | 'ko' | 'ja';

/** Anything we have no UI copy for reads English. */
export function uiLanguageFrom(languageCode: string | null | undefined): UiLanguage {
  const code = (languageCode ?? '').slice(0, 2).toLowerCase();
  return code === 'ko' || code === 'ja' ? code : 'en';
}

const en = {
  tagline: 'Scan before you eat — safety in one glance.',

  // Allergy setup
  allergyProfile: 'Allergy profile',
  allergyProfileSubtitle: 'Pick everything you react to. Every scan is matched against this list.',
  searchPlaceholder: 'Search allergens — milk, 우유, Sellerie…',
  searchLabel: 'Search allergens',
  noPresetMatch: (query: string) => `No preset matches “${query}”. Add it as a custom allergen below.`,
  custom: 'Custom',
  customSubtitle: 'Anything else, in the language on your labels.',
  customPlaceholder: 'e.g. 메밀, mustard',
  add: 'Add',
  longPressHint: 'Long-press a custom tag to delete it.',
  selectAtLeastOne: 'Select at least one',
  saveAndScan: (count: number) => `Save ${count} & scan`,
  signOut: 'Sign out',

  // Camera
  capturing: 'Capturing photo…',
  reading: 'Reading the label…',
  translating: 'Translating…',
  photoFailed: 'Could not save the photo. Try again.',
  scanFailed: 'Scan failed. Try again.',
  noTextFound: 'No text found. Move closer to the label and try again.',
  cameraPermission: 'Camera permission',
  cameraPermissionBody:
    'allens needs the camera to read ingredient labels. Photos stay on this device; the label text is sent to Google Translate.',
  grantPermission: 'Grant permission',
  openSettings: 'Open settings',
  setupTitle: 'Set up your allergies',
  setupBody: 'Tell allens what to look for and every scan will flag it automatically.',
  chooseAllergies: 'Choose allergies',
  allergies: 'Allergies',
  history: 'History',
  scanLabel: 'Scan label',

  // History
  scanHistory: 'Scan history',
  emptyHistory: 'No scans yet. Capture a label to see it here.',
  noMatches: '✓ No matches',
  matched: (names: string) => `⚠ ${names}`,
  danger: (names: string) => `Danger · ${names}`,
  safe: 'Safe · no matches',
  notChecked: 'Not checked',
  notCheckedBody: 'No allergies selected, so nothing was matched. Choose your allergies to judge this scan.',
  nameThisScan: 'Name this scan',
  translatedText: 'Translated text',
  originalText: 'Original text',
  deleteScan: 'Delete this scan',
  scanNotFound: 'Scan not found. Return to history and try again.',
};

type Copy = typeof en;

const ko: Copy = {
  tagline: '먹기 전에 스캔 — 한눈에 안전 확인',

  allergyProfile: '알레르기 프로필',
  allergyProfileSubtitle: '반응하는 항목을 모두 선택. 스캔할 때마다 이 목록과 대조합니다.',
  searchPlaceholder: '알레르기 검색 — 우유, milk, Sellerie…',
  searchLabel: '알레르기 검색',
  noPresetMatch: (query: string) => `“${query}” 검색 결과 없음. 아래에서 직접 추가.`,
  custom: '직접 추가',
  customSubtitle: '그 밖의 항목. 라벨에 적힌 언어로 입력.',
  customPlaceholder: '예: 메밀, mustard',
  add: '추가',
  longPressHint: '직접 추가한 항목은 길게 눌러 삭제.',
  selectAtLeastOne: '하나 이상 선택',
  saveAndScan: (count: number) => `${count}개 저장 후 스캔`,
  signOut: '로그아웃',

  capturing: '촬영 중…',
  reading: '라벨 읽는 중…',
  translating: '번역 중…',
  photoFailed: '사진 저장 실패. 다시 시도.',
  scanFailed: '스캔 실패. 다시 시도.',
  noTextFound: '텍스트 없음. 라벨에 더 가까이서 다시 시도.',
  cameraPermission: '카메라 권한',
  cameraPermissionBody:
    '원재료 라벨을 읽으려면 카메라가 필요합니다. 사진은 기기에만 저장되고, 라벨 텍스트는 Google 번역으로 전송됩니다.',
  grantPermission: '권한 허용',
  openSettings: '설정 열기',
  setupTitle: '알레르기 설정',
  setupBody: '찾을 항목을 지정하면 스캔할 때마다 자동으로 표시합니다.',
  chooseAllergies: '알레르기 선택',
  allergies: '알레르기',
  history: '기록',
  scanLabel: '라벨 스캔',

  scanHistory: '스캔 기록',
  emptyHistory: '스캔 없음. 라벨을 촬영하면 여기에 표시.',
  noMatches: '✓ 해당 없음',
  matched: (names: string) => `⚠ ${names}`,
  danger: (names: string) => `위험 · ${names}`,
  safe: '안전 · 해당 없음',
  notChecked: '확인 안 됨',
  notCheckedBody: '선택한 알레르기가 없어 대조하지 않았습니다. 알레르기를 선택하면 이 스캔을 판정합니다.',
  nameThisScan: '이름 입력',
  translatedText: '번역',
  originalText: '원문',
  deleteScan: '스캔 삭제',
  scanNotFound: '스캔을 찾을 수 없음. 기록으로 돌아가 다시 시도.',
};

const ja: Copy = {
  tagline: '食べる前にスキャン — ひと目で安全確認',

  allergyProfile: 'アレルギー設定',
  allergyProfileSubtitle: '反応するものをすべて選択。スキャンごとにこのリストと照合します。',
  searchPlaceholder: 'アレルゲン検索 — 乳, milk, Sellerie…',
  searchLabel: 'アレルゲン検索',
  noPresetMatch: (query: string) => `「${query}」に一致なし。下で追加。`,
  custom: 'カスタム',
  customSubtitle: 'その他。ラベルの言語で入力。',
  customPlaceholder: '例: そば, mustard',
  add: '追加',
  longPressHint: 'カスタムはロングタップで削除。',
  selectAtLeastOne: '1つ以上選択',
  saveAndScan: (count: number) => `${count}件 保存してスキャン`,
  signOut: 'ログアウト',

  capturing: '撮影中…',
  reading: 'ラベル読み取り中…',
  translating: '翻訳中…',
  photoFailed: '写真を保存できません。再試行。',
  scanFailed: 'スキャン失敗。再試行。',
  noTextFound: '文字を検出できません。ラベルに近づけて再試行。',
  cameraPermission: 'カメラ許可',
  cameraPermissionBody:
    '原材料ラベルの読み取りにカメラが必要です。写真は端末内のみ。ラベルの文字は Google 翻訳に送信されます。',
  grantPermission: '許可する',
  openSettings: '設定を開く',
  setupTitle: 'アレルギー設定',
  setupBody: '探す項目を指定すると、スキャンごとに自動で表示します。',
  chooseAllergies: 'アレルギーを選択',
  allergies: 'アレルギー',
  history: '履歴',
  scanLabel: 'ラベルをスキャン',

  scanHistory: 'スキャン履歴',
  emptyHistory: 'スキャンなし。ラベルを撮影すると表示。',
  noMatches: '✓ 該当なし',
  matched: (names: string) => `⚠ ${names}`,
  danger: (names: string) => `危険 · ${names}`,
  safe: '安全 · 該当なし',
  notChecked: '未確認',
  notCheckedBody: '選択中のアレルギーがないため照合していません。アレルギーを選ぶとこのスキャンを判定します。',
  nameThisScan: '名前を入力',
  translatedText: '翻訳',
  originalText: '原文',
  deleteScan: 'スキャンを削除',
  scanNotFound: 'スキャンが見つかりません。履歴に戻って再試行。',
};

const COPY: Record<UiLanguage, Copy> = { en, ko, ja };

/** All UI copy for one language. Screens call this once per render. */
export function strings(language: UiLanguage): Copy {
  return COPY[language];
}

/**
 * Display names for the preset allergens, keyed by the canonical English name.
 *
 * The English name is the *identity* of an allergen — `store/allergies.ts`
 * persists it in `selected` — so it can never change with the UI language.
 * This is display only, and anything unlisted (every custom allergen, which the
 * user typed themselves) falls back to the name as given.
 */
const ALLERGEN_NAMES: Record<UiLanguage, Record<string, string>> = {
  en: {},
  ko: {
    Milk: '우유',
    Egg: '계란',
    Peanut: '땅콩',
    'Tree nut': '견과류',
    Soy: '대두',
    Wheat: '밀',
    Shellfish: '갑각류·조개',
    Fish: '생선',
    Sesame: '참깨',
    Buckwheat: '메밀',
    Pork: '돼지고기',
    Sulfites: '아황산류',
    Celery: '셀러리',
    Mustard: '겨자',
    Lupin: '루핀',
    Squid: '오징어',
    Peach: '복숭아',
    Tomato: '토마토',
    Chicken: '닭고기',
    Beef: '쇠고기',
    Gelatin: '젤라틴',
    Apple: '사과',
    Banana: '바나나',
    Kiwi: '키위',
    Orange: '오렌지',
  },
  ja: {
    Milk: '乳',
    Egg: '卵',
    Peanut: '落花生',
    'Tree nut': 'ナッツ類',
    Soy: '大豆',
    Wheat: '小麦',
    Shellfish: '甲殻類・貝',
    Fish: '魚',
    Sesame: 'ごま',
    Buckwheat: 'そば',
    Pork: '豚肉',
    Sulfites: '亜硫酸塩',
    Celery: 'セロリ',
    Mustard: 'からし',
    Lupin: 'ルピナス',
    Squid: 'いか',
    Peach: 'もも',
    Tomato: 'トマト',
    Chicken: '鶏肉',
    Beef: '牛肉',
    Gelatin: 'ゼラチン',
    Apple: 'りんご',
    Banana: 'バナナ',
    Kiwi: 'キウイ',
    Orange: 'オレンジ',
  },
};

/** The allergen's display name, falling back to the canonical English one. */
export function allergenLabel(name: string, language: UiLanguage): string {
  return ALLERGEN_NAMES[language][name] ?? name;
}

/** Comma-joined display names, for the danger badge and history subtitles. */
export function allergenLabels(names: string[], language: UiLanguage): string {
  return names.map((name) => allergenLabel(name, language)).join(', ');
}

export { ALLERGEN_NAMES };
