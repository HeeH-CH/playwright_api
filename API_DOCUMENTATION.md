# 🎭 Playwright HTTP API Documentation

## 📋 목차
- [서버 정보](#서버-정보)
- [세션 관리](#세션-관리)
- [브라우저 관리](#브라우저-관리)
- [페이지 조작](#페이지-조작)
- [요소 상호작용](#요소-상호작용)
- [키보드/스크롤](#키보드스크롤)
- [파일/미디어](#파일미디어)
- [고급 선택자 시스템](#고급-선택자-시스템)
- [에러 코드](#에러-코드)

## 🚀 서버 정보

### 기본 정보
- **Port**: 3001 (기본값)
- **Base URL**: `http://localhost:3001`
- **Content-Type**: `application/json`
- **세션 타임아웃**: 30분

---

## 🔄 세션 관리

### GET /health
서버 상태 확인

**응답**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T12:30:00.000Z",
  "activeSessions": 3,
  "uptime": 1234.567
}
```

### GET /sessions
활성 세션 목록 조회

**응답**
```json
{
  "sessions": [
    {
      "sessionId": "session_1_1705320600000",
      "url": "https://example.com",
      "createdAt": "2024-01-15T12:30:00.000Z",
      "lastActivity": "2024-01-15T12:35:00.000Z",
      "ageMinutes": 5,
      "inactiveMinutes": 0,
      "status": "active",
      "mutexStatus": {
        "locked": false,
        "waitingCount": 0
      }
    }
  ],
  "count": 1,
  "activeCount": 1,
  "expiredCount": 0,
  "timeoutMinutes": 30,
  "mutexCount": 1
}
```

### POST /session/extend
세션 연장

**요청**
```json
{
  "sessionId": "session_1_1705320600000"
}
```

**응답**
```json
{
  "success": true,
  "sessionId": "session_1_1705320600000",
  "extendedAt": "2024-01-15T12:40:00.000Z",
  "message": "Session extended successfully"
}
```

### POST /sessions/cleanup
모든 세션 강제 종료

**응답**
```json
{
  "success": true,
  "closedSessions": ["session_1_1705320600000", "session_2_1705320700000"],
  "errors": [],
  "message": "2개 세션 종료 완료"
}
```

---

## 🌐 브라우저 관리

### POST /browser/launch
브라우저 시작

**요청**
```json
{
  "browser": "chromium",  // chromium, firefox, webkit
  "headless": true,       // true, false
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "userAgent": "Mozilla/5.0...",  // 선택사항
  "locale": "ko-KR",              // 선택사항
  "timezone": "Asia/Seoul"        // 선택사항
}
```

**응답**
```json
{
  "success": true,
  "sessionId": "session_1_1705320600000",
  "browser": "chromium",
  "headless": true,
  "message": "chromium browser launched successfully"
}
```

### POST /browser/close
브라우저 종료

**요청**
```json
{
  "sessionId": "session_1_1705320600000"
}
```

**응답**
```json
{
  "success": true,
  "message": "Browser closed successfully"
}
```

---

## 📄 페이지 조작

### POST /page/goto
페이지 이동

**요청**
```json
{
  "sessionId": "session_1_1705320600000",
  "url": "https://example.com",
  "options": {
    "waitUntil": "domcontentloaded",  // domcontentloaded, load, networkidle
    "timeout": 60000
  }
}
```

**응답**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain"
}
```

### POST /page/reload
페이지 새로고침

**요청**
```json
{
  "sessionId": "session_1_1705320600000"
}
```

**응답**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain"
}
```

### POST /page/content
HTML 콘텐츠 가져오기 (정리 옵션 포함)

**기본 요청**
```json
{
  "sessionId": "session_1_1705320600000"
}
```

**HTML 정리 옵션 포함 요청**
```json
{
  "sessionId": "session_1_1705320600000",
  "cleanOptions": {
    "clean": true,
    "removeImages": true,
    "removeVideos": true,
    "removeAudios": true,
    "removeScripts": true,
    "removeStyles": true,
    "removeComments": true,
    "removeEmptyElements": true,
    "removeForms": false,
    "removeIframes": false
  }
}
```

**응답 (정리 옵션 미사용)**
```json
{
  "success": true,
  "content": "<!DOCTYPE html><html>...",
  "length": 12345,
  "originalLength": 12345,
  "cleaningStats": null,
  "cleanOptions": {
    "clean": false
  }
}
```

**응답 (정리 옵션 사용)**
```json
{
  "success": true,
  "content": "<!DOCTYPE html><html><head><title>Example</title></head><body><h1>Title</h1><p>Content</p></body></html>",
  "length": 8976,
  "originalLength": 15432,
  "cleaningStats": {
    "originalLength": 15432,
    "cleanedLength": 8976,
    "reducedBy": 6456,
    "reductionPercent": 42
  },
  "cleanOptions": {
    "clean": true,
    "removeImages": true,
    "removeVideos": true,
    "removeAudios": true,
    "removeScripts": true,
    "removeStyles": true,
    "removeComments": true,
    "removeEmptyElements": true,
    "removeForms": false,
    "removeIframes": false
  }
}
```

#### HTML 정리 옵션 상세

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `clean` | `false` | HTML 정리 기능 활성화 |
| `removeImages` | `true` | `<img>`, `<picture>`, `<figure>` 태그 제거 |
| `removeVideos` | `true` | `<video>`, `<source>` 태그 제거 |
| `removeAudios` | `true` | `<audio>` 태그 제거 |
| `removeScripts` | `true` | `<script>`, `<noscript>` 태그 제거 |
| `removeStyles` | `true` | `<style>` 태그, 인라인 스타일, CSS 링크 제거 |
| `removeComments` | `true` | HTML 주석 제거 |
| `removeEmptyElements` | `true` | 빈 태그 및 공백 정리 |
| `removeForms` | `false` | 폼 요소들 제거 (`<form>`, `<input>`, `<textarea>`, `<select>`, `<button>`) |
| `removeIframes` | `false` | `<iframe>`, `<embed>`, `<object>` 태그 제거 |

#### 자동 제거 요소
- 광고 관련 div (class 또는 id에 "ad" 포함)
- 배너 관련 div (class에 "banner" 포함)
- 여러 공백을 하나로 정리
- 태그 간 불필요한 공백 제거

#### 사용 예시

**텍스트 콘텐츠만 필요한 경우**
```json
{
  "sessionId": "session_1_1705320600000",
  "cleanOptions": {
    "clean": true,
    "removeImages": true,
    "removeVideos": true,
    "removeScripts": true,
    "removeStyles": true,
    "removeForms": true,
    "removeIframes": true
  }
}
```

**구조는 유지하되 미디어만 제거**
```json
{
  "sessionId": "session_1_1705320600000",
  "cleanOptions": {
    "clean": true,
    "removeImages": true,
    "removeVideos": true,
    "removeAudios": true,
    "removeScripts": false,
    "removeStyles": false,
    "removeForms": false,
    "removeIframes": false
  }
}
```

### POST /page/info
페이지 정보 가져오기

**요청**
```json
{
  "sessionId": "session_1_1705320600000"
}
```

**응답**
```json
{
  "success": true,
  "info": {
    "url": "https://example.com",
    "title": "Example Domain",
    "timestamp": "2024-01-15T12:30:00.000Z"
  }
}
```

### POST /page/evaluate
JavaScript 실행

**요청**
```json
{
  "sessionId": "session_1_1705320600000",
  "script": "document.title"
}
```

**응답**
```json
{
  "success": true,
  "result": "Example Domain"
}
```

**복잡한 스크립트 예시**
```json
{
  "sessionId": "session_1_1705320600000",
  "script": "Array.from(document.querySelectorAll('a')).map(a => ({text: a.textContent, href: a.href}))"
}
```

---

## 🖱️ 요소 상호작용

### POST /page/click
요소 클릭

**기본 사용**
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": "button.submit"
}
```

**iframe 내부 요소 클릭**
```json
{
  "sessionId": "session_1_1705320600000",
  "frameSelector": "iframe[name='mainFrame']",
  "selector": "button.submit"
}
```

**getBy 메소드 사용**
```json
{
  "sessionId": "session_1_1705320600000",
  "getByRole": {
    "role": "button",
    "name": "Submit",
    "exact": true
  }
}
```

**고급 필터링**
```json
{
  "sessionId": "session_1_1705320600000",
  "getByRole": { "role": "paragraph" },
  "filter": { "hasText": "제목" },
  "first": true
}
```

**클릭 옵션**
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": "button",
  "options": {
    "button": "right",      // left, right, middle
    "clickCount": 2,        // 더블클릭
    "delay": 100,          // 클릭 지연 (ms)
    "force": true,         // 강제 클릭
    "timeout": 15000
  }
}
```

### POST /page/fill
텍스트 입력

**기본 사용**
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": "input[name='username']",
  "text": "myusername"
}
```

**getByPlaceholder 사용**
```json
{
  "sessionId": "session_1_1705320600000",
  "getByPlaceholder": "이메일을 입력하세요",
  "text": "user@example.com"
}
```

**iframe 내부 입력**
```json
{
  "sessionId": "session_1_1705320600000",
  "frameSelector": "iframe#editor",
  "selector": "textarea",
  "text": "Hello World!"
}
```

### POST /page/waitFor
요소 대기

**요소가 나타날 때까지 대기**
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": ".loading",
  "options": {
    "state": "visible",    // visible, hidden, attached, detached
    "timeout": 30000
  }
}
```

**요소가 사라질 때까지 대기**
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": ".spinner",
  "options": {
    "state": "hidden",
    "timeout": 10000
  }
}
```

### POST /page/getText
텍스트 가져오기

**요청**
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": "h1.title"
}
```

**응답**
```json
{
  "success": true,
  "text": "Welcome to Example"
}
```

### POST /page/getAttribute
속성 가져오기

**요청**
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": "a.download",
  "attribute": "href"
}
```

**응답**
```json
{
  "success": true,
  "value": "https://example.com/file.pdf"
}
```

---

## ⌨️ 키보드/스크롤

### POST /page/keyboard
키보드 조작

**단일 키 입력**
```json
{
  "sessionId": "session_1_1705320600000",
  "action": "press",
  "key": "Enter"
}
```

**키 조합**
```json
{
  "sessionId": "session_1_1705320600000",
  "action": "press",
  "key": "Control+A"
}
```

**텍스트 타이핑**
```json
{
  "sessionId": "session_1_1705320600000",
  "action": "type",
  "text": "Hello World!",
  "delay": 50
}
```

**유니코드 텍스트 입력 (이모지 포함)**
```json
{
  "sessionId": "session_1_1705320600000",
  "action": "insertText",
  "text": "안녕하세요! 😊\n줄바꿈 테스트",
  "delay": 30
}
```

**반복 키 입력**
```json
{
  "sessionId": "session_1_1705320600000",
  "action": "press",
  "key": "ArrowDown",
  "repeat": 5,
  "delay": 100
}
```

**키 누르고 떼기**
```json
{
  "sessionId": "session_1_1705320600000",
  "action": "down",
  "key": "Shift"
}
```

### POST /page/scroll
스크롤

**상대적 스크롤**
```json
{
  "sessionId": "session_1_1705320600000",
  "x": 0,
  "y": 500
}
```

**위로 스크롤**
```json
{
  "sessionId": "session_1_1705320600000",
  "x": 0,
  "y": -300
}
```

---

## 📁 파일/미디어

### POST /page/screenshot
스크린샷

**전체 페이지**
```json
{
  "sessionId": "session_1_1705320600000",
  "options": {
    "fullPage": true,
    "type": "png"
  }
}
```

**특정 영역만**
```json
{
  "sessionId": "session_1_1705320600000",
  "options": {
    "clip": {
      "x": 0,
      "y": 0,
      "width": 800,
      "height": 600
    }
  }
}
```

**응답**
```json
{
  "success": true,
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA..."  // base64 인코딩된 이미지
}
```

### POST /page/uploadFile
파일 업로드

**Base64 파일 업로드**
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": "input[type='file']",
  "files": [
    {
      "name": "document.pdf",
      "mimeType": "application/pdf",
      "base64": "JVBERi0xLjQKJcOkw7zDtsO..."
    }
  ]
}
```

**로컬 파일 경로**
```json
{
  "sessionId": "session_1_1705320600000",
  "getByLabel": "파일 선택",
  "files": [
    { "path": "/tmp/upload.jpg" }
  ]
}
```

**다중 파일 업로드**
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": "input[type='file'][multiple]",
  "files": [
    { "path": "/tmp/file1.jpg" },
    { "path": "/tmp/file2.png" },
    {
      "name": "document.txt",
      "mimeType": "text/plain",
      "base64": "SGVsbG8gV29ybGQh"
    }
  ]
}
```

---

## 🎯 고급 선택자 시스템

### 기본 선택자 방법

#### 1. CSS 선택자
```json
{
  "selector": "button.primary"
}
```

#### 2. getBy 메소드들
```json
{
  "getByRole": { "role": "button", "name": "Submit" },
  "getByText": "Click me",
  "getByLabel": "Email",
  "getByPlaceholder": "Enter your name",
  "getByAltText": "Profile picture",
  "getByTitle": "Close dialog",
  "getByTestId": "submit-button"
}
```

### Frame 지원

#### 1. 단일 Frame
```json
{
  "frameSelector": "iframe[name='mainFrame']",
  "selector": "button.submit"
}
```

#### 2. 중첩 Frame
```json
{
  "frameChain": ["iframe.outer", "iframe.inner"],
  "selector": "input"
}
```

#### 3. Frame 체이닝 문법
```json
{
  "selector": "iframe.outer >> iframe.inner >> button"
}
```

### 고급 필터링

#### 1. filter() 메소드
```json
{
  "getByRole": { "role": "paragraph" },
  "filter": {
    "hasText": "제목"  // 특정 텍스트 포함
  }
}
```

```json
{
  "selector": "div",
  "filter": {
    "has": "button"  // 특정 자식 요소 포함
  }
}
```

```json
{
  "selector": "div",
  "filter": {
    "hasNot": ".disabled"  // 특정 자식 요소 미포함
  }
}
```

#### 2. 위치 선택자
```json
{
  "getByRole": { "role": "button" },
  "first": true  // 첫 번째 요소
}
```

```json
{
  "getByRole": { "role": "listitem" },
  "last": true  // 마지막 요소
}
```

```json
{
  "getByRole": { "role": "option" },
  "nth": 2  // 3번째 요소 (0-based)
}
```

### 복합 사용 예시

**복잡한 iframe 내부 필터링**
```json
{
  "sessionId": "session_1_1705320600000",
  "frameSelector": "iframe[name='editor']",
  "getByRole": { "role": "paragraph" },
  "filter": { "hasText": "중요" },
  "first": true
}
```

**중첩 프레임에서 n번째 요소**
```json
{
  "sessionId": "session_1_1705320600000",
  "frameChain": ["iframe.main", "iframe.content"],
  "getByRole": { "role": "button" },
  "filter": { "hasText": "저장" },
  "nth": 1
}
```

---

## 🚨 에러 코드

### 400 Bad Request
- 필수 파라미터 누락
- 잘못된 파라미터 형식

```json
{
  "success": false,
  "error": "sessionId is required"
}
```

### 404 Not Found
- 세션을 찾을 수 없음

```json
{
  "success": false,
  "error": "Session not found"
}
```

### 500 Internal Server Error
- 요소를 찾을 수 없음
- 타임아웃 발생
- 브라우저 오류

```json
{
  "success": false,
  "error": "Timeout 15000ms exceeded"
}
```

---

## 💡 팁과 모범 사례

### 1. 타임아웃 설정
```json
{
  "options": {
    "timeout": 30000  // 30초
  }
}
```

### 2. 안정적인 대기
```json
{
  "sessionId": "session_1_1705320600000",
  "selector": ".loading",
  "options": {
    "state": "hidden"  // 로딩이 완료될 때까지 대기
  }
}
```

### 3. 재시도 로직
```javascript
async function clickWithRetry(sessionId, selector, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/page/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, selector })
      });
      
      if (response.ok) return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### 4. 세션 정리
```javascript
// 작업 완료 후 항상 세션 정리
await fetch('/browser/close', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
});
```

---

## 🔧 환경 변수

```bash
PORT=3001                    # 서버 포트
SESSION_TIMEOUT=1800000     # 세션 타임아웃 (30분)
```

---

## 📚 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [CSS 선택자 가이드](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [JavaScript 키보드 이벤트](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)

---

**📝 마지막 업데이트**: 2024-01-15  
**🎭 API 버전**: 1.0.0  
**🔧 Playwright 버전**: Latest