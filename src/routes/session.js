const express = require('express');
const { sessions, SESSION_TIMEOUT, getSession, cleanupAllSessions } = require('../utils/sessionManager');
const { sessionMutexes } = require('../middleware/mutex');

const router = express.Router();

// 세션 연장
router.post('/extend', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.lastActivity = new Date();

    res.json({
      success: true,
      sessionId: sessionId,
      extendedAt: session.lastActivity,
      message: 'Session extended successfully'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 활성 세션 목록 (개선된 버전)
router.get('/', (req, res) => {
  const now = new Date();
  const sessionList = Array.from(sessions.entries()).map(([id, session]) => {
    const ageMinutes = Math.round((now - session.createdAt) / 60000);
    const inactiveMinutes = Math.round((now - session.lastActivity) / 60000);
    const mutex = sessionMutexes.get(id);
    return {
      sessionId: id,
      url: session.page ? session.page.url() : 'unknown',
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      ageMinutes: ageMinutes,
      inactiveMinutes: inactiveMinutes,
      status: inactiveMinutes > 30 ? 'expired' : 'active',
      mutexStatus: {
        locked: mutex ? mutex.isLocked() : false,
        waitingCount: mutex ? mutex._waiting.length : 0
      }
    };
  });

  res.json({
    sessions: sessionList,
    count: sessionList.length,
    activeCount: sessionList.filter(s => s.status === 'active').length,
    expiredCount: sessionList.filter(s => s.status === 'expired').length,
    timeoutMinutes: SESSION_TIMEOUT / 60000,
    mutexCount: sessionMutexes.size
  });
});

// 모든 세션 강제 종료
router.post('/cleanup', async (req, res) => {
  try {
    const result = await cleanupAllSessions();

    res.json({
      success: true,
      closedSessions: result.closedSessions,
      errors: result.errors,
      message: `${result.closedSessions.length}개 세션 종료 완료`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;