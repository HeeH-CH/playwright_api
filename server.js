const express = require('express');

// 미들웨어 import
const { corsMiddleware } = require('./src/middleware/cors');

// 라우터 import
const sessionRoutes = require('./src/routes/session');
const browserRoutes = require('./src/routes/browser');
const pageRoutes = require('./src/routes/page');
const interactionRoutes = require('./src/routes/interaction');

// 세션 정리를 위한 import (정리 작업이 자동 시작됨)
require('./src/utils/sessionManager');

const app = express();

// 미들웨어 설정
app.use(express.json({ limit: '50mb' }));
app.use(corsMiddleware);

// 상태 확인
app.get('/health', (req, res) => {
  const { sessions } = require('./src/utils/sessionManager');

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size,
    uptime: process.uptime()
  });
});

// 라우터 연결
app.use('/session', sessionRoutes);
app.use('/sessions', sessionRoutes); // 호환성을 위한 별칭
app.use('/browser', browserRoutes);
app.use('/page', pageRoutes);

// 상호작용 라우트들을 /page 하위에 마운트 (기존 API 호환성 유지)
app.use('/page', interactionRoutes);

// 에러 핸들링
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Playwright HTTP API Server Started! (Modular Version)');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  GET  /health              - 서버 상태');
  console.log('  GET  /sessions            - 활성 세션 목록');
  console.log('  POST /session/extend      - 세션 연장');
  console.log('  POST /sessions/cleanup    - 모든 세션 강제 종료');
  console.log('  POST /browser/launch      - 브라우저 시작');
  console.log('  POST /browser/close       - 브라우저 종료');
  console.log('  POST /page/goto           - 페이지 이동');
  console.log('  POST /page/content        - HTML 가져오기 (정리 옵션 포함)');
  console.log('  POST /page/info           - 페이지 정보');
  console.log('  POST /page/evaluate       - JavaScript 실행');
  console.log('  POST /page/click          - 요소 클릭');
  console.log('  POST /page/fill           - 텍스트 입력');
  console.log('  POST /page/waitFor        - 요소 대기');
  console.log('  POST /page/screenshot     - 스크린샷');
  console.log('  POST /page/uploadFile     - 파일 업로드');
  console.log('  POST /page/getText        - 텍스트 가져오기');
  console.log('  POST /page/getAttribute   - 속성 가져오기');
  console.log('  POST /page/keyboard       - 키보드 입력');
  console.log('  POST /page/scroll         - 스크롤');
  console.log('');
  console.log('✨ 준비 완료! 크롤링을 시작하세요.');
});

// 프로세스 종료 시 모든 브라우저 정리
process.on('SIGINT', async () => {
  console.log('\n🔄 서버 종료 중...');

  const { sessions, cleanupAllSessions } = require('./src/utils/sessionManager');
  const { sessionMutexes } = require('./src/middleware/mutex');

  try {
    await cleanupAllSessions();
  } catch (error) {
    console.error('❌ 세션 정리 실패:', error.message);
  }

  // 모든 뮤텍스 정리
  sessionMutexes.clear();
  console.log('🧹 모든 뮤텍스 정리 완료');

  console.log('👋 서버 종료 완료');
  process.exit(0);
});