// 뮤텍스 클래스와 관리
const sessionMutexes = new Map();

class Mutex {
  constructor() {
    this._locked = false;
    this._waiting = [];
  }

  async lock() {
    return new Promise((resolve) => {
      if (!this._locked) {
        this._locked = true;
        resolve();
      } else {
        this._waiting.push(resolve);
      }
    });
  }

  unlock() {
    if (this._waiting.length > 0) {
      const resolve = this._waiting.shift();
      resolve();
    } else {
      this._locked = false;
    }
  }

  isLocked() {
    return this._locked;
  }
}

// 세션별 뮤텍스 획득
function getSessionMutex(sessionId) {
  if (!sessionMutexes.has(sessionId)) {
    sessionMutexes.set(sessionId, new Mutex());
  }
  return sessionMutexes.get(sessionId);
}

// 뮤텍스로 래핑된 세션 실행 함수
async function withSessionMutex(sessionId, operation) {
  const mutex = getSessionMutex(sessionId);

  console.log(`🔒 세션 ${sessionId} 뮤텍스 락 요청 (대기: ${mutex._waiting.length})`);

  await mutex.lock();

  try {
    console.log(`✅ 세션 ${sessionId} 뮤텍스 락 획득`);
    const result = await operation();
    return result;
  } finally {
    mutex.unlock();
    console.log(`🔓 세션 ${sessionId} 뮤텍스 락 해제`);
  }
}

module.exports = {
  Mutex,
  sessionMutexes,
  getSessionMutex,
  withSessionMutex
};