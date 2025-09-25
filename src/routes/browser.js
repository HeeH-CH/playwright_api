const express = require('express');
const { sessions, generateSessionId, getSession } = require('../utils/sessionManager');
const { sessionMutexes } = require('../middleware/mutex');
const {
  getBrowserEngine,
  getDefaultStealthMode,
  parseBoolean
} = require('../utils/browserFactory');

const router = express.Router();

// 브라우저 시작
router.post('/launch', async (req, res) => {
  try {
    const {
      browser = 'chromium',
      headless = true,
      viewport = { width: 1920, height: 1080 },
      userAgent,
      locale = 'ko-KR',
      timezone = 'Asia/Seoul',
      stealth
    } = req.body;

    const requestedStealth = stealth !== undefined
      ? parseBoolean(stealth)
      : getDefaultStealthMode();

    const {
      engine,
      name: resolvedBrowser,
      stealth: stealthEnabled
    } = getBrowserEngine(browser, { useStealth: requestedStealth });

    console.log(`🚀 브라우저 시작: ${resolvedBrowser}, headless: ${headless}, stealth: ${stealthEnabled}`);

    const launchOptions = {
      headless,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    };

    const browserInstance = await engine.launch(launchOptions);

    // 브라우저 컨텍스트 생성
    const context = await browserInstance.newContext({
      viewport,
      userAgent,
      locale,
      timezoneId: timezone
    });

    // 새 페이지 생성
    const page = await context.newPage();
    const sessionId = generateSessionId();

    // 세션 저장
    sessions.set(sessionId, {
      browser: browserInstance,
      context,
      page,
      createdAt: new Date(),
      lastActivity: new Date(),
      mode: stealthEnabled ? 'stealth' : 'standard'
    });

    console.log(`✅ 브라우저 시작 완료: ${sessionId}`);

    res.json({
      success: true,
      sessionId,
      browser: resolvedBrowser,
      headless: headless,
      stealth: stealthEnabled,
      message: `${resolvedBrowser} browser launched successfully`
    });

  } catch (error) {
    console.error('❌ 브라우저 시작 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 브라우저 종료
router.post('/close', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    console.log(`🔄 브라우저 종료: ${sessionId}`);

    await session.browser.close();
    sessions.delete(sessionId);
    // 뮤텍스도 함께 정리
    sessionMutexes.delete(sessionId);

    console.log(`✅ 브라우저 종료 완료: ${sessionId}`);

    res.json({
      success: true,
      message: 'Browser closed successfully'
    });

  } catch (error) {
    console.error('❌ 브라우저 종료 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
