'use strict';

const PrivacyConsent = require('../models/PrivacyConsent');

/**
 * GET /api/auth/consent/status
 * Returns whether the authenticated user has already accepted the privacy policy.
 */
const getConsentStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id;
    const userRole = req.user?.role || 'student';

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const record = await PrivacyConsent.hasAccepted(userId, userRole);

    return res.json({
      hasConsented: !!record,
      consentDate: record?.accepted_at || null,
      consentVersion: record?.consent_version || null,
    });
  } catch (err) {
    console.error('Privacy consent status error:', err.message);
    return res.status(500).json({ message: 'Failed to check consent status.' });
  }
};

/**
 * POST /api/auth/consent/accept
 * Records that the authenticated user accepted the privacy policy.
 * Body: { consentVersion?: string }
 */
const acceptConsent = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id;
    const userRole = req.user?.role || 'student';

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const consentVersion = req.body?.consentVersion || '1.0';
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.connection?.remoteAddress ||
      null;

    await PrivacyConsent.recordConsent({
      userId,
      userRole,
      consentVersion,
      ipAddress,
    });

    return res.json({
      message: 'Privacy consent recorded successfully.',
      hasConsented: true,
      consentVersion,
    });
  } catch (err) {
    console.error('Privacy consent accept error:', err.message);
    return res.status(500).json({ message: 'Failed to record consent.' });
  }
};

module.exports = { getConsentStatus, acceptConsent };
