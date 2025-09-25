// 세션 관리 유틸리티
const sessions = new Map();
let sessionCounter = 0;

// 세션 타임아웃 설정 (30분)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분

// 유틸리티 함수
function generateSessionId() {
  return `session_${++sessionCounter}_${Date.now()}`;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date(); // 활동 시간 업데이트
  }
  return session;
}

// 자동 정리 함수 (lastActivity 기반)
function cleanupExpiredSessions() {
  const now = Date.now();

  for (const [sessionId, session] of sessions.entries()) {
    const lastActivityAge = now - session.lastActivity.getTime();

    if (lastActivityAge > SESSION_TIMEOUT) {
      console.log(`🧹 비활성 세션 정리: ${sessionId} (마지막 활동: ${Math.round(lastActivityAge / 60000)}분 전)`);

      try {
        session.browser.close();
        sessions.delete(sessionId);
        console.log(`✅ 세션 ${sessionId} 정리 완료`);
      } catch (error) {
        console.error(`❌ 세션 ${sessionId} 정리 실패:`, error.message);
        sessions.delete(sessionId); // 맵에서는 제거
      }
    }
  }
}

// 5분마다 만료된 세션 정리
const cleanupInterval = setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

// 모든 세션 강제 종료
async function cleanupAllSessions() {
  const closedSessions = [];
  const errors = [];

  for (const [sessionId, session] of sessions.entries()) {
    try {
      await session.browser.close();
      sessions.delete(sessionId);
      closedSessions.push(sessionId);
      console.log(`🧹 강제 종료: ${sessionId}`);
    } catch (error) {
      errors.push({ sessionId, error: error.message });
      sessions.delete(sessionId); // 맵에서는 제거
    }
  }

  return { closedSessions, errors };
}

module.exports = {
  sessions,
  SESSION_TIMEOUT,
  generateSessionId,
  getSession,
  cleanupExpiredSessions,
  cleanupAllSessions,
  cleanupInterval
};