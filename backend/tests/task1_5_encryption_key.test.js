const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config();

const { validateSecurityEnv } = require('../server');
const {
  encryptMetadata,
  decryptMetadata,
  getEncryptionKey,
} = require('../utils/privacy');
const { pool } = require('../config/db');

describe('Task 1.5: Harden Encryption Key & Startup Validation', () => {
  const origJwtSecret = process.env.JWT_SECRET;
  const origPrivacyKey = process.env.PRIVACY_ENCRYPTION_KEY;

  after(async () => {
    process.env.JWT_SECRET = origJwtSecret;
    process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;
    await pool.end();
  });

  it('1. Refuses to start when JWT_SECRET is missing or empty', () => {
    try {
      delete process.env.JWT_SECRET;
      process.env.PRIVACY_ENCRYPTION_KEY = 'valid_distinct_privacy_key_12345';
      assert.throws(
        () => validateSecurityEnv(),
        (err) => err.message.includes('JWT_SECRET environment variable is missing')
      );

      process.env.JWT_SECRET = '   ';
      assert.throws(
        () => validateSecurityEnv(),
        (err) => err.message.includes('JWT_SECRET environment variable is missing')
      );
    } finally {
      process.env.JWT_SECRET = origJwtSecret;
      process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;
    }
  });

  it('2. Refuses to start when PRIVACY_ENCRYPTION_KEY is missing or empty', () => {
    try {
      process.env.JWT_SECRET = 'valid_distinct_jwt_secret_12345';
      delete process.env.PRIVACY_ENCRYPTION_KEY;
      assert.throws(
        () => validateSecurityEnv(),
        (err) => err.message.includes('PRIVACY_ENCRYPTION_KEY environment variable is missing')
      );

      process.env.PRIVACY_ENCRYPTION_KEY = '   ';
      assert.throws(
        () => validateSecurityEnv(),
        (err) => err.message.includes('PRIVACY_ENCRYPTION_KEY environment variable is missing')
      );
    } finally {
      process.env.JWT_SECRET = origJwtSecret;
      process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;
    }
  });

  it('3. Refuses to start when PRIVACY_ENCRYPTION_KEY is identical to JWT_SECRET', () => {
    try {
      const sharedKey = 'identical_shared_secret_key_12345';
      process.env.JWT_SECRET = sharedKey;
      process.env.PRIVACY_ENCRYPTION_KEY = sharedKey;

      assert.throws(
        () => validateSecurityEnv(),
        (err) => err.message.includes('must not be identical to JWT_SECRET')
      );
    } finally {
      process.env.JWT_SECRET = origJwtSecret;
      process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;
    }
  });

  it('4. Successfully validates startup when both keys are distinct and non-empty', () => {
    try {
      process.env.JWT_SECRET = 'distinct_jwt_secret_key_98765';
      process.env.PRIVACY_ENCRYPTION_KEY = 'distinct_privacy_encryption_key_54321';

      assert.doesNotThrow(() => validateSecurityEnv());
    } finally {
      process.env.JWT_SECRET = origJwtSecret;
      process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;
    }
  });

  it('5. privacy.js getEncryptionKey() fails without fallback if PRIVACY_ENCRYPTION_KEY is missing', () => {
    try {
      delete process.env.PRIVACY_ENCRYPTION_KEY;
      process.env.JWT_SECRET = 'some_jwt_secret_value';

      assert.throws(
        () => getEncryptionKey(),
        (err) => err.message.includes('PRIVACY_ENCRYPTION_KEY is required and missing')
      );
    } finally {
      process.env.JWT_SECRET = origJwtSecret;
      process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;
    }
  });

  it('6. privacy.js getEncryptionKey() fails if PRIVACY_ENCRYPTION_KEY equals JWT_SECRET', () => {
    try {
      const shared = 'same_key_for_both';
      process.env.PRIVACY_ENCRYPTION_KEY = shared;
      process.env.JWT_SECRET = shared;

      assert.throws(
        () => getEncryptionKey(),
        (err) => err.message.includes('must not be identical to JWT_SECRET')
      );
    } finally {
      process.env.JWT_SECRET = origJwtSecret;
      process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;
    }
  });

  it('7. Existing database respondent references still decrypt with the configured key', async () => {
    process.env.JWT_SECRET = origJwtSecret;
    process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;

    const [rows] = await pool.execute(
      'SELECT id, student_id, anonymous_student_ref FROM evaluations WHERE anonymous_student_ref IS NOT NULL'
    );

    assert.ok(rows.length > 0, 'Expected existing evaluations with anonymous_student_ref in DB');

    for (const row of rows) {
      const decrypted = decryptMetadata(row.anonymous_student_ref);
      assert.ok(decrypted, `Expected successful decryption for evaluation id ${row.id}`);
      assert.ok(decrypted.sid !== undefined, 'Decrypted payload should have sid');
      assert.ok(decrypted.ts !== undefined, 'Decrypted payload should have ts');
    }
  });

  it('8. Round-trip encryption and decryption functions accurately with versioned format', () => {
    process.env.JWT_SECRET = origJwtSecret;
    process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;

    const testPayload = {
      sid: 'std_test_encryption_roundtrip',
      ts: '2026-10-04T15:00:00.000Z',
      customField: 12345,
    };

    const token = encryptMetadata(testPayload);
    assert.ok(token.startsWith('v1.'), `Expected token to start with v1., got: ${token}`);
    assert.equal(token.split('.').length, 4, 'Expected token format: v1.iv.tag.data');

    const decrypted = decryptMetadata(token);
    assert.deepEqual(decrypted, testPayload);
  });

  it('9. Decryption fails on tampered token or corrupted authentication tag', () => {
    process.env.JWT_SECRET = origJwtSecret;
    process.env.PRIVACY_ENCRYPTION_KEY = origPrivacyKey;

    const token = encryptMetadata({ sid: 'std_tamper', ts: new Date().toISOString() });
    const parts = token.split('.');

    // Tamper with the ciphertext (parts[3])
    const tamperedData = parts[0] + '.' + parts[1] + '.' + parts[2] + '.' + 'tamperedDataAAAA';
    assert.throws(() => decryptMetadata(tamperedData));

    // Tamper with the auth tag (parts[2])
    const tamperedTag = parts[0] + '.' + parts[1] + '.' + 'badTagAAAAAA' + '.' + parts[3];
    assert.throws(() => decryptMetadata(tamperedTag));
  });
});
