const express = require('express');
const { getSession } = require('../utils/sessionManager');
const { resolveLocator } = require('../utils/locatorResolver');
const { withSessionMutex } = require('../middleware/mutex');

const router = express.Router();

// 요소 클릭
router.post('/click', async (req, res) => {
  try {
    const {
      sessionId,
      selector,
      frameSelector,
      frameChain,
      options = {},
      getByRole,
      getByText,
      getByLabel,
      getByPlaceholder,
      getByAltText,
      getByTitle,
      getByTestId,
      // advanced methods
      filter,
      first,
      last,
      nth
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    await withSessionMutex(sessionId, async () => {
      const session = getSession(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      console.log(`🖱️ 클릭: ${selector || getByRole || getByText || getByLabel || getByPlaceholder || getByAltText || getByTitle || getByTestId}`);

      const locator = resolveLocator(session.page, {
        selector,
        frameSelector,
        frameChain,
        getByRole,
        getByText,
        getByLabel,
        getByPlaceholder,
        getByAltText,
        getByTitle,
        getByTestId,
        filter,
        first,
        last,
        nth
      });

      await locator.click({
        timeout: 15000,
        ...options
      });

      console.log(`✅ 클릭 완료: ${selector}`);
    });

    res.json({ success: true });

  } catch (error) {
    console.error('❌ 클릭 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 텍스트 입력
router.post('/fill', async (req, res) => {
  try {
    const {
      sessionId,
      selector,
      text,
      frameSelector,
      frameChain,
      options = {},
      getByRole,
      getByText,
      getByLabel,
      getByPlaceholder,
      getByAltText,
      getByTitle,
      getByTestId,
      // advanced methods
      filter,
      first,
      last,
      nth
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    await withSessionMutex(sessionId, async () => {
      const session = getSession(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      console.log(`⌨️ 텍스트 입력: ${selector || getByRole || getByText || getByLabel || getByPlaceholder || getByAltText || getByTitle || getByTestId} -> "${text}"`);

      const locator = resolveLocator(session.page, {
        selector,
        frameSelector,
        frameChain,
        getByRole,
        getByText,
        getByLabel,
        getByPlaceholder,
        getByAltText,
        getByTitle,
        getByTestId,
        filter,
        first,
        last,
        nth
      });

      try {
        await locator.fill(text, {
          timeout: 15000,
          ...options
        });
      } catch {
        console.log(`🔄 대체 입력 방식 사용: ${selector}`);
        await locator.click({ timeout: 15000 });
        await session.page.keyboard.down('Control');
        await session.page.keyboard.press('KeyA');
        await session.page.keyboard.up('Control');
        await session.page.keyboard.type(text, { delay: 10 });
      }

      console.log(`✅ 텍스트 입력 완료: ${selector}`);
    });

    res.json({ success: true });

  } catch (error) {
    console.error('❌ 텍스트 입력 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 요소 대기
router.post('/waitFor', async (req, res) => {
  try {
    const {
      sessionId,
      selector,
      frameSelector,
      frameChain,
      options = {},
      getByRole,
      getByText,
      getByLabel,
      getByPlaceholder,
      getByAltText,
      getByTitle,
      getByTestId,
      // advanced methods
      filter,
      first,
      last,
      nth
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    await withSessionMutex(sessionId, async () => {
      const session = getSession(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      console.log(`⏳ 요소 대기: ${selector || getByRole || getByText || getByLabel || getByPlaceholder || getByAltText || getByTitle || getByTestId}`);

      const locator = resolveLocator(session.page, {
        selector,
        frameSelector,
        frameChain,
        getByRole,
        getByText,
        getByLabel,
        getByPlaceholder,
        getByAltText,
        getByTitle,
        getByTestId,
        filter,
        first,
        last,
        nth
      });

      await locator.waitFor({
        timeout: 30000,
        ...options
      });

      console.log(`✅ 요소 대기 완료: ${selector}`);
    });

    res.json({ success: true });

  } catch (error) {
    console.error('❌ 요소 대기 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 파일 업로드 (일반)
router.post('/uploadFile', async (req, res) => {
  try {
    const {
      sessionId,
      selector,
      frameSelector,
      frameChain,
      files,
      options = {},
      getByRole,
      getByText,
      getByLabel,
      getByPlaceholder,
      getByAltText,
      getByTitle,
      getByTestId,
      // advanced methods
      filter,
      first,
      last,
      nth
    } = req.body;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files array is required' });
    }

    console.log(`📁 파일 업로드 시작: ${files.length}개 파일`);

    // 파일 데이터 처리
    const fileInputs = files.map(file => {
      if (file.base64) {
        // Base64 데이터 처리
        const base64Data = file.base64.replace(/^data:[^;]+;base64,/, '');
        return {
          name: file.name || 'file',
          mimeType: file.mimeType || 'application/octet-stream',
          buffer: Buffer.from(base64Data, 'base64')
        };
      } else if (file.path) {
        // 로컬 파일 경로
        return file.path;
      } else if (file.buffer && file.name) {
        // 직접 buffer 제공
        return {
          name: file.name,
          mimeType: file.mimeType || 'application/octet-stream',
          buffer: Buffer.from(file.buffer)
        };
      } else {
        throw new Error('Invalid file format: requires base64, path, or buffer+name');
      }
    });

    // 파일 input 요소에 파일 설정
    if (selector || getByRole || getByText || getByLabel || getByPlaceholder || getByAltText || getByTitle || getByTestId) {
      // 특정 selector 또는 getBy 메소드 사용
      const locator = resolveLocator(session.page, {
        selector,
        frameSelector,
        frameChain,
        getByRole,
        getByText,
        getByLabel,
        getByPlaceholder,
        getByAltText,
        getByTitle,
        getByTestId,
        filter,
        first,
        last,
        nth
      });

      if (files.length === 1) {
        await locator.setInputFiles(fileInputs[0], options);
      } else {
        await locator.setInputFiles(fileInputs, options);
      }
    } else {
      // selector가 없으면 페이지의 첫 번째 file input 찾기
      const fileInput = session.page.locator('input[type="file"]').first();

      if (files.length === 1) {
        await fileInput.setInputFiles(fileInputs[0], options);
      } else {
        await fileInput.setInputFiles(fileInputs, options);
      }
    }

    console.log('✅ 파일 업로드 완료');

    res.json({
      success: true,
      uploadedFiles: files.map(f => f.name || f.path),
      count: files.length
    });

  } catch (error) {
    console.error('❌ 파일 업로드 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;