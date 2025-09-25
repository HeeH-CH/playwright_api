# HTML Cleaner 사용 예시

## 개요
`src/utils/htmlCleaner.js`에 정의된 `cleanHtmlContent(html, options)`는 크롤링한 HTML을 후처리해서 광고/추적 요소를 제거하고, 허용 혹은 차단 목록 기반으로 내용을 정리하며, 추출 결과를 `sanitize-html`과 `he`를 통해 정제합니다. 아래는 현재 프로젝트에서 확인된 모든 사용 예시와 옵션 패턴입니다.

## 1. 런타임 사용처
### `src/routes/page.js`
- **맥락**: `/content` 엔드포인트가 Playwright 세션에서 받은 원본 HTML(`rawContent`)을 정리할 때 호출합니다.
- **옵션 흐름**: 요청 본문으로 전달된 `cleanOptions` 객체를 그대로 넘기며, `clean` 플래그가 `true`일 때만 실제 정리를 수행합니다. 정리 이후 길이 감소량을 계산해 `cleaningStats`로 응답합니다.

```javascript
// src/routes/page.js:3,126 부근
const { cleanHtmlContent } = require('../utils/htmlCleaner');
// ...
const rawContent = await session.page.content();
const content = cleanHtmlContent(rawContent, cleanOptions);
```

- **특이사항**: `cleanOptions`를 지정하지 않으면 기본값 `{ clean: false }`가 적용되어 원본 HTML을 그대로 반환합니다.

## 2. 문서화된 활용 예시
### `ARCHITECTURE.md`
- **denylist 기반 정리**: 광고/추적 요소를 적극적으로 제거하는 패턴을 안내합니다.

```javascript
cleanHtmlContent(html, {
  clean: true,
  useDenylist: true,
  denyTags: ['img','video','iframe'],
  denySelectors: ['.sponsored','[data-ad]'],
  denyAttributes: { '*': ['style','onclick'], a: ['rel','target'] },
  denySchemes: ['javascript','data'],
  denyAnchorHrefPatterns: ['^/out\\?', '([?&])ad=']
});
```

- **allowlist 기반 정리**: 허용 목록만 유지하고 나머지를 제거하는 보수적인 옵션 구성을 예시로 제공합니다.

```javascript
cleanHtmlContent(html, {
  clean: true,
  useAllowlist: true,
  allowedTags: ['p','a','strong','em','ul','ol','li','code','pre','blockquote','br'],
  allowedAttributes: { a: ['href','title'] }
});
```

이 문서에 기재된 예시 외의 호출부는 현재 코드베이스에 존재하지 않습니다.

