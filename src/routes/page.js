const express = require('express');
const { getSession } = require('../utils/sessionManager');
const { cleanHtmlContent } = require('../utils/htmlCleaner');
const { withSessionMutex } = require('../middleware/mutex');

const router = express.Router();

// 페이지 이동
router.post('/goto', async (req, res) => {
  try {
    const { sessionId, url, options = {} } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    const result = await withSessionMutex(sessionId, async () => {
      const session = getSession(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      console.log(`🌐 페이지 이동: ${url}`);

      // 네이버와 같은 무거운 사이트를 위한 개선된 페이지 로드 로직
      const defaultOptions = {
        waitUntil: 'domcontentloaded', // networkidle보다 안정적
        timeout: 60000, // 30초 -> 60초로 증가
        ...options
      };

      // 재시도 로직 (최대 2회)
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          await session.page.goto(url, defaultOptions);
          break; // 성공하면 루프 탈출
        } catch (error) {
          retryCount++;
          console.log(`⚠️ 페이지 로드 시도 ${retryCount}/${maxRetries + 1} 실패: ${error.message}`);

          if (retryCount > maxRetries) {
            // 최종 실패 시 domcontentloaded로 한 번 더 시도
            console.log('🔄 domcontentloaded로 최종 시도...');
            await session.page.goto(url, {
              ...defaultOptions,
              waitUntil: 'domcontentloaded',
              timeout: 45000
            });
            break;
          }

          // 재시도 전 잠깐 대기
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const pageInfo = {
        url: session.page.url(),
        title: await session.page.title()
      };

      console.log(`✅ 페이지 로드 완료: ${pageInfo.title}`);

      return pageInfo;
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ 페이지 이동 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 페이지 새로고침
router.post('/reload', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.page.reload({ waitUntil: 'networkidle' });

    res.json({
      success: true,
      url: session.page.url(),
      title: await session.page.title()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HTML 콘텐츠 가져오기 (정리 옵션 포함)
router.post('/content', async (req, res) => {
  try {
    const { sessionId, cleanOptions } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('📄 HTML 콘텐츠 추출 중...');

    const rawContent = await session.page.content();

    // HTML 정리 옵션이 있으면 정리 처리
    const content = cleanHtmlContent(rawContent, cleanOptions);

    console.log(`✅ HTML 추출 완료: ${rawContent.length} -> ${content.length} 문자`);

    // 정리 통계 정보
    const cleaningStats = cleanOptions?.clean ? {
      originalLength: rawContent.length,
      cleanedLength: content.length,
      reducedBy: rawContent.length - content.length,
      reductionPercent: Math.round(((rawContent.length - content.length) / rawContent.length) * 100)
    } : null;

    res.json({
      success: true,
      content: content,
      length: content.length,
      originalLength: rawContent.length,
      cleaningStats: cleaningStats,
      cleanOptions: cleanOptions || { clean: false }
    });

  } catch (error) {
    console.error('❌ HTML 추출 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 페이지 정보 가져오기
router.post('/info', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const info = {
      url: session.page.url(),
      title: await session.page.title(),
      timestamp: new Date().toISOString()
    };

    res.json({ success: true, info });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// JavaScript 실행 (브라우저 컨텍스트에서)
router.post('/evaluate', async (req, res) => {
  try {
    const { sessionId, script } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('🔧 JavaScript 실행 중...');

    // 브라우저 컨텍스트에서 스크립트 실행
    const result = await session.page.evaluate((scriptToExecute) => {
      return eval(scriptToExecute);
    }, script);

    console.log('✅ JavaScript 실행 완료');

    res.json({ success: true, result });

  } catch (error) {
    console.error('❌ JavaScript 실행 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 스크린샷
router.post('/screenshot', async (req, res) => {
  try {
    const { sessionId, options = {} } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('📸 스크린샷 캡처 중...');

    const screenshot = await session.page.screenshot({
      type: 'png',
      encoding: 'base64',
      fullPage: false,
      ...options
    });

    console.log('✅ 스크린샷 완료');

    res.json({
      success: true,
      screenshot: screenshot
    });

  } catch (error) {
    console.error('❌ 스크린샷 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 텍스트 가져오기
router.post('/getText', async (req, res) => {
  try {
    const { sessionId, selector } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const text = await session.page.textContent(selector);

    res.json({
      success: true,
      text: text
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 속성 가져오기
router.post('/getAttribute', async (req, res) => {
  try {
    const { sessionId, selector, attribute } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const value = await session.page.getAttribute(selector, attribute);

    res.json({
      success: true,
      value: value
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 키보드 입력
router.post('/keyboard', async (req, res) => {
  try {
    const { sessionId, action, key, text, delay = 50, repeat = 1 } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    switch (action) {
      case 'press':
        for (let i = 0; i < repeat; i++) {
          await session.page.keyboard.press(key);
          if (repeat > 1 && delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        break;
      case 'type':
        await session.page.keyboard.type(text, { delay });
        break;
      case 'insertText':
        // 개행 문자를 실제 Enter 키로 처리하고 유니코드 안전 입력
        const lines = text.replace(/\r\n/g, '\n').split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]) {
            // 유니코드 안전 입력 (이모지 포함)
            await session.page.keyboard.type(lines[i], { delay: delay });
          }
          if (i < lines.length - 1) {
            await session.page.keyboard.press('Enter');
          }
        }
        break;
      case 'down':
        await session.page.keyboard.down(key);
        break;
      case 'up':
        await session.page.keyboard.up(key);
        break;
      default:
        return res.status(400).json({ error: 'Invalid keyboard action' });
    }

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 스크롤
router.post('/scroll', async (req, res) => {
  try {
    const { sessionId, x = 0, y = 0 } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.page.evaluate(({ x, y }) => {
      window.scrollBy(x, y);
    }, { x, y });

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;