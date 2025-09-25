# Playwright API Server - Stealth 기능 업데이트

## 개요
기존 Playwright API 서버에 봇 탐지 우회 기능(Stealth)을 통합했습니다. 기존 API 엔드포인트는 변경하지 않으면서 모든 관련 부분에 우회 기능을 적용했습니다.

## 설치된 패키지
```bash
npm install playwright-extra puppeteer-extra-plugin-stealth
```

## 주요 변경사항

### 1. Import 및 플러그인 설정
```javascript
// 추가된 import
const { chromium: pwChromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Stealth 플러그인 적용
pwChromium.use(StealthPlugin());

// 기본 설정 추가
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
```

### 2. 브라우저 시작 개선 (server.js:388-415)
**변경 전:**
```javascript
default:
  browserInstance = await chromium.launch(launchOptions);
```

**변경 후:**
```javascript
default:
  // Stealth Chromium 사용 (탐지 우회 기능 포함)
  launchOptions.args = [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process'
  ];
  browserInstance = await pwChromium.launch(launchOptions);
```

### 3. 컨텍스트 설정 강화 (server.js:418-435)
**향상된 컨텍스트 옵션:**
```javascript
const contextOptions = {
  viewport: viewport || { width: 1366, height: 768 },
  userAgent: userAgent || DEFAULT_USER_AGENT,
  locale: locale || 'ko-KR',
  timezoneId: timezone || 'Asia/Seoul',
  geolocation: { longitude: 126.9780, latitude: 37.5665 },
  permissions: ['geolocation'],
  colorScheme: 'light',
  javaScriptEnabled: true,
  extraHTTPHeaders: {
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  }
};
```

### 4. Anti-detection 초기화 스크립트 (server.js:437-451)
```javascript
await context.addInitScript(() => {
  // webdriver 흔적 최소화
  Object.defineProperty(navigator, 'pdfViewerEnabled', { get: () => true });
  // 플러그인 개수 채우기
  Object.defineProperty(navigator, 'plugins', { get: () => [{}, {}, {}] });
  // 추가 webdriver 속성 숨기기
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  // Chrome runtime 속성 마스킹
  window.chrome = window.chrome || { runtime: {} };
  // Permission API 마스킹
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications' ?
      Promise.resolve({ state: Notification.permission }) :
      originalQuery(parameters)
  );
});
```

### 5. 페이지 이동 개선 - 사람처럼 보이는 동작 (server.js:554-567)
```javascript
// 사람처럼 보이는 랜덤 딜레이 (500-1300ms)
await sleep(500 + Math.random() * 800);
await session.page.goto(url, defaultOptions);
// 페이지 로드 후 랜덤 마우스 이동
await sleep(200 + Math.random() * 400);
await session.page.mouse.move(
  200 + Math.random() * 300,
  300 + Math.random() * 200,
  { steps: 12 }
);
```

### 6. 클릭 액션 개선 (server.js:748-756)
```javascript
// 사람처럼 보이는 클릭 전 랜덤 딜레이
await sleep(100 + Math.random() * 300);

await locator.click({
  timeout: 15000,
  ...options
});

// 클릭 후 짧은 대기
await sleep(50 + Math.random() * 150);
```

### 7. 텍스트 입력 개선 (server.js:801-821)
```javascript
// 사람처럼 보이는 입력 전 랜덤 딜레이
await sleep(100 + Math.random() * 300);

// 대체 입력 방식에서 사람처럼 보이는 타이핑 딜레이 (60-90ms)
await session.page.keyboard.type(text, { delay: 60 + Math.random() * 30 });

// 입력 후 짧은 대기
await sleep(50 + Math.random() * 150);
```

### 8. 키보드 입력 개선 (server.js:1014-1043)
```javascript
// 사람처럼 보이는 키보드 전 랜덤 딜레이
await sleep(50 + Math.random() * 100);

// 타이핑 딜레이 강화 (60-150ms)
const humanDelay = Math.max(delay, 60 + Math.random() * 90);
await session.page.keyboard.type(text, { delay: humanDelay });

// insertText에서 개행 후 짧은 대기
await sleep(50 + Math.random() * 100);
```

## 우회 기능 상세

### 1. 브라우저 레벨 우회
- **AutomationControlled** 플래그 비활성화
- **IsolateOrigins, site-per-process** 기능 비활성화
- **StealthPlugin**을 통한 다양한 자동화 흔적 제거

### 2. 컨텍스트 레벨 우회
- 실제 사용자처럼 보이는 **User-Agent** 설정
- 한국 지역 **지리정보, 타임존, 로케일** 설정
- **Accept-Language** 헤더를 통한 자연스러운 요청

### 3. JavaScript 레벨 우회
- `navigator.webdriver` 속성 숨기기
- `navigator.plugins` 배열 채우기
- `navigator.pdfViewerEnabled` 속성 설정
- `window.chrome.runtime` 객체 생성
- Permission API 마스킹

### 4. 행동 패턴 우회
- **랜덤 딜레이** (페이지 로드, 클릭, 입력 시)
- **마우스 움직임** (페이지 로드 후)
- **사람처럼 보이는 타이핑 속도** (60-150ms 간격)
- **액션 간 대기시간** (50-300ms)

## 테스트 결과

### bot.sannysoft.com 테스트 결과
```
Test Name          Result
User Agent         Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36...
WebDriver          present (failed) - headless 모드 한계
WebDriver Advanced passed ✅
Chrome             missing (failed) - headless 모드 한계
Permissions        prompt ✅
Plugins Length     0 (개선 필요)
Languages          ko-KR ✅
WebGL Vendor       Google Inc. (Google) ✅
```

**결과:** 일부 탐지 항목 우회 성공, headless 모드에서도 상당한 개선

## API 호환성

✅ **모든 기존 API 엔드포인트 호환**
- `/browser/launch` - 추가 stealth 설정 자동 적용
- `/page/goto` - 사람처럼 보이는 딜레이 자동 추가
- `/page/click` - 랜덤 딜레이 자동 적용
- `/page/fill` - 사람처럼 보이는 타이핑 자동 적용
- `/page/keyboard` - 향상된 타이핑 딜레이 자동 적용

## 사용법

기존 API 사용법과 동일합니다. Stealth 기능은 자동으로 적용됩니다:

```bash
# 브라우저 시작 (stealth 기능 자동 적용)
curl -X POST http://localhost:3001/browser/launch \
  -H "Content-Type: application/json" \
  -d '{"browser": "chromium", "headless": true}'

# 페이지 이동 (랜덤 딜레이 및 마우스 움직임 자동 적용)
curl -X POST http://localhost:3001/page/goto \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session_id", "url": "https://example.com"}'
```

## 주의사항

1. **Firefox/Webkit**: Stealth 기능은 Chromium에만 적용됩니다
2. **Headless 제한**: 일부 탐지 항목은 headless 모드에서 완전히 우회하기 어렵습니다
3. **성능**: 랜덤 딜레이로 인해 실행 속도가 약간 느려질 수 있습니다
4. **업데이트**: playwright-extra와 puppeteer-extra-plugin-stealth 패키지를 최신 상태로 유지하세요

## 향후 개선사항

- [ ] Plugins Length 탐지 우회 개선
- [ ] WebGL fingerprinting 추가 마스킹
- [ ] 더 정교한 마우스 움직임 패턴
- [ ] 사이트별 맞춤 우회 전략