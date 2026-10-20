/**
 * Security Headers Middleware (Task 4.3 / NFR-01)
 * Provides comprehensive HTTP security response headers matching Helmet standards
 * with zero third-party dependencies.
 */

const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Legacy browser XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer information policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cross-Origin policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

  // Strict Transport Security (HSTS) in production or HTTPS
  if (process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove Express fingerprinting header
  res.removeHeader('X-Powered-By');

  next();
};

module.exports = securityHeaders;
