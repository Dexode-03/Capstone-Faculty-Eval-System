const crypto = require('crypto');
require('dotenv').config();

const ALGO = 'aes-256-gcm';

const getEncryptionKey = () => {
  const raw = process.env.PRIVACY_ENCRYPTION_KEY || process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(raw).digest();
};

const encryptMetadata = (metadata) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const payload = JSON.stringify(metadata || {});

  const encrypted = Buffer.concat([
    cipher.update(payload, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Versioned payload: v1.iv.tag.data (base64url)
  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
};

const buildAnonymousRespondentRef = ({ studentId }) => {
  const token = encryptMetadata({
    sid: studentId,
    ts: new Date().toISOString(),
  });

  return token.length > 255 ? token.slice(0, 255) : token;
};

const buildDecoupledSentimentText = ({ strengths, weaknesses }) => {
  // Sentiment analysis receives text-only payload (no identity fields).
  return [strengths || '', weaknesses || ''].filter(Boolean).join(' ') || 'No comments provided.';
};

module.exports = {
  encryptMetadata,
  buildAnonymousRespondentRef,
  buildDecoupledSentimentText,
};
