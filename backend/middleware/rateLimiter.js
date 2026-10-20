/**
 * In-Memory Sliding Window Rate Limiter Middleware (Task 4.3 / NFR-01)
 *
 * Implements sliding-window rate limiting per client IP.
 * Zero external dependencies.
 *
 * Features:
 * - Configurable window size (ms) and max request count
 * - Returns 429 Too Many Requests with Retry-After header
 * - Automatic memory cleanup of stale IP records
 * - Gracefully bypassed during automated unit tests (NODE_ENV === 'test')
 *   unless explicitly tested.
 */

function createRateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutes default
  max = 10,                  // 10 attempts default
  message = 'Too many requests from this IP, please try again later.',
  keyPrefix = 'global',
} = {}) {
  const hits = new Map();

  // Periodic cleanup every 5 minutes to prevent memory leaks
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, valid);
      }
    }
  }, 5 * 60 * 1000);

  // Do not hold Node process open during shutdown/tests
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  const rateLimiterMiddleware = (req, res, next) => {
    // In test environment, allow bypassing unless header 'x-test-rate-limit' is explicitly passed
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const clientHits = (hits.get(key) || []).filter(t => now - t < windowMs);

    if (clientHits.length >= max) {
      const oldestHit = clientHits[0];
      const retryAfterSec = Math.ceil((windowMs - (now - oldestHit)) / 1000);
      res.setHeader('Retry-After', Math.max(retryAfterSec, 1));
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        message,
        retryAfterSeconds: Math.max(retryAfterSec, 1),
      });
    }

    clientHits.push(now);
    hits.set(key, clientHits);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(max - clientHits.length, 0));

    next();
  };

  rateLimiterMiddleware.reset = () => {
    hits.clear();
  };

  return rateLimiterMiddleware;
}

// Pre-configured rate limiters for sensitive endpoints
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 failed/repeated login attempts
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  keyPrefix: 'login',
});

const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 password reset requests
  message: 'Too many password reset requests. Please wait 15 minutes before trying again.',
  keyPrefix: 'forgot-pwd',
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                  // 10 account creations
  message: 'Too many accounts registered from this device. Please try again later.',
  keyPrefix: 'register',
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  registerLimiter,
};
