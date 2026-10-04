const crypto = require('crypto');
require('dotenv').config();

const ALGO = 'aes-256-gcm';

const getEncryptionKey = () => {
  const raw = process.env.PRIVACY_ENCRYPTION_KEY;
  if (!raw || raw.trim() === '') {
    throw new Error('FATAL: PRIVACY_ENCRYPTION_KEY is required and missing from environment variables.');
  }
  if (process.env.JWT_SECRET && raw.trim() === process.env.JWT_SECRET.trim()) {
    throw new Error('FATAL: PRIVACY_ENCRYPTION_KEY must not be identical to JWT_SECRET.');
  }
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

const decryptMetadata = (token) => {
  if (!token || typeof token !== 'string' || !token.startsWith('v1.')) {
    throw new Error('Invalid or unsupported token format');
  }
  const parts = token.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid token structure');
  }
  const [, ivB64, tagB64, encB64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const enc = Buffer.from(encB64, 'base64url');

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
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
  decryptMetadata,
  buildAnonymousRespondentRef,
  buildDecoupledSentimentText,
  getEncryptionKey,
};
