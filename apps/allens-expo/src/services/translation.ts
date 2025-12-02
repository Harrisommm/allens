export async function translateTextAsync(text: string, targetLocale: string) {
  // 간단한 더미 비동기 처리 (향후 실제 API 연동 시 여기 교체)
  await new Promise((resolve) => setTimeout(resolve, 100));

  // targetLocale이 en-US, ko-KR 이런 식으로 들어와도 앞의 언어 코드만 사용
  const lang = targetLocale.split('-')[0];

  // TODO: 나중에 성분들을 계속 추가할 수 있는 간단한 사전
  const ingredientTranslations: Record<string, Record<string, string>> = {
    // 물 계열 예시: 정제수
    '정제수': {
      ko: '정제수',
      en: 'purified water',
      ja: '精製水',
      zh: '纯净水',
    },
    // 필요하면 여기 아래에 더 추가:
    // '물': { ko: '물', en: 'water', ja: '水', zh: '水' },
    // ...
  };

  const key = text.trim();
  const translated = ingredientTranslations[key]?.[lang];

  // 사전에 등록된 성분이면 번역 결과 반환, 아니면 원문 그대로 반환
  if (translated) {
    return translated;
  }

  return text;
}
