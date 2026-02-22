import rateLimit from 'express-rate-limit';

/**
 * Default rate limiter: 100 requests per minute per user/IP
 * Used for general API routes
 */
export const defaultLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    if (req.user?.id) {
      return req.user.id;
    }
    // Normalize IPv6 localhost to IPv4 for consistency
    const ip = req.ip;
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    return ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: Math.ceil(60) // seconds
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 10 requests per minute to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const ip = req.ip;
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    return ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      retryAfter: Math.ceil(60)
    });
  },
  skipSuccessfulRequests: false
});

/**
 * Very strict limiter for password reset
 * 5 requests per 15 minutes
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const ip = req.ip;
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    return ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many password reset attempts, please try again later',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

/**
 * Generation rate limiter
 * 20 generations per hour per user
 */
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 generations per hour
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    if (req.user?.id) {
      return req.user.id;
    }
    const ip = req.ip;
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    return ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Generation rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60)
    });
  }
});

/**
 * Upload rate limiter
 * 10 uploads per hour per user
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    if (req.user?.id) {
      return req.user.id;
    }
    const ip = req.ip;
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    return ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Upload rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60)
    });
  }
});

export default {
  defaultLimiter,
  authLimiter,
  passwordResetLimiter,
  generationLimiter,
  uploadLimiter
};
