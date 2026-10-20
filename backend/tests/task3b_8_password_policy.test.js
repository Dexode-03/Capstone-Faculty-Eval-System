'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { validatePasswordPolicy, PASSWORD_MIN_LENGTH } = require('../utils/passwordPolicy');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const AuditLog = require('../models/AuditLog');
const {
  register,
  resetPassword,
  changePassword,
  adminCreateAccount,
  login,
} = require('../controllers/authController');

describe('Task 3B.8: Password and Token Policy (NFR-01)', () => {
  let origUserFindByEmail;
  let origUserFindById;
  let origUserCreate;
  let origUserUpdatePassword;
  let origPasswordResetFindByToken;
  let origPasswordResetDelete;
  let origAuditLog;

  before(() => {
    origUserFindByEmail = User.findByEmail;
    origUserFindById = User.findById;
    origUserCreate = User.create;
    origUserUpdatePassword = User.updatePassword;
    origPasswordResetFindByToken = PasswordReset.findByToken;
    origPasswordResetDelete = PasswordReset.deleteByEmail;
    origAuditLog = AuditLog.log;

    AuditLog.log = async () => {};
  });

  after(() => {
    User.findByEmail = origUserFindByEmail;
    User.findById = origUserFindById;
    User.create = origUserCreate;
    User.updatePassword = origUserUpdatePassword;
    PasswordReset.findByToken = origPasswordResetFindByToken;
    PasswordReset.deleteByEmail = origPasswordResetDelete;
    AuditLog.log = origAuditLog;
  });

  const createMockReqRes = (body = {}, user = { id: 1, role: 'admin' }, params = {}) => {
    const req = {
      body,
      user,
      params,
      ip: '127.0.0.1',
    };
    let responseStatus = 200;
    let responseData = null;

    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      },
      getStatus: () => responseStatus,
      getData: () => responseData,
    };
    return { req, res };
  };

  describe('1. Password Policy Validator (length >= 8, mix of letters & numbers)', () => {
    it('enforces PASSWORD_MIN_LENGTH is 8', () => {
      assert.equal(PASSWORD_MIN_LENGTH, 8);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const weak1 = validatePasswordPolicy('Ab1');
      assert.equal(weak1.isValid, false);
      assert.match(weak1.message, /at least 8 characters/i);

      const weak2 = validatePasswordPolicy('Passw1');
      assert.equal(weak2.isValid, false);
      assert.match(weak2.message, /at least 8 characters/i);

      const weak3 = validatePasswordPolicy('1234567');
      assert.equal(weak3.isValid, false);
      assert.match(weak3.message, /at least 8 characters/i);
    });

    it('rejects 8+ character passwords with letters only (missing numbers)', () => {
      const noNumbers = validatePasswordPolicy('abcdefghi');
      assert.equal(noNumbers.isValid, false);
      assert.match(noNumbers.message, /mix of letters and numbers/i);

      const capitalizedNoNumbers = validatePasswordPolicy('AllLettersNoNumbers');
      assert.equal(capitalizedNoNumbers.isValid, false);
      assert.match(capitalizedNoNumbers.message, /mix of letters and numbers/i);
    });

    it('rejects 8+ character passwords with numbers only (missing letters)', () => {
      const numbersOnly = validatePasswordPolicy('12345678');
      assert.equal(numbersOnly.isValid, false);
      assert.match(numbersOnly.message, /mix of letters and numbers/i);

      const longNumbers = validatePasswordPolicy('987654321098765');
      assert.equal(longNumbers.isValid, false);
      assert.match(longNumbers.message, /mix of letters and numbers/i);
    });

    it('rejects empty, null, or non-string inputs', () => {
      assert.equal(validatePasswordPolicy('').isValid, false);
      assert.equal(validatePasswordPolicy(null).isValid, false);
      assert.equal(validatePasswordPolicy(undefined).isValid, false);
      assert.equal(validatePasswordPolicy(12345678).isValid, false);
    });

    it('accepts compliant passwords (>= 8 chars with both letters and numbers)', () => {
      assert.equal(validatePasswordPolicy('Password123').isValid, true);
      assert.equal(validatePasswordPolicy('PsuAdmin2024').isValid, true);
      assert.equal(validatePasswordPolicy('a1b2c3d4').isValid, true);
      assert.equal(validatePasswordPolicy('complexP@ssw0rd!').isValid, true);
    });
  });

  describe('2. Path Enforcement (Weak passwords rejected on every path)', () => {
    it('REJECTS weak password on Registration (/api/auth/register)', async () => {
      // 1) Length < 8
      const { req: req1, res: res1 } = createMockReqRes({
        name: 'Test Student',
        email: 'student@psu.edu.ph',
        password: 'Pass1',
        confirmPassword: 'Pass1',
        role: 'student',
        year_level: '1st Year',
        section: 'A',
        department: 'CS',
        subject_ids: [1],
      });
      await register(req1, res1);
      assert.equal(res1.getStatus(), 400);
      assert.match(res1.getData().message, /at least 8 characters/i);

      // 2) No numbers
      const { req: req2, res: res2 } = createMockReqRes({
        name: 'Test Student',
        email: 'student@psu.edu.ph',
        password: 'OnlyLettersHere',
        confirmPassword: 'OnlyLettersHere',
        role: 'student',
        year_level: '1st Year',
        section: 'A',
        department: 'CS',
        subject_ids: [1],
      });
      await register(req2, res2);
      assert.equal(res2.getStatus(), 400);
      assert.match(res2.getData().message, /mix of letters and numbers/i);
    });

    it('REJECTS weak password on Admin Account Creation (/api/auth/admin/accounts)', async () => {
      // 1) Length < 8
      const { req: req1, res: res1 } = createMockReqRes(
        {
          name: 'Faculty User',
          email: 'fac@psu.edu.ph',
          password: '12345',
          role: 'faculty',
          department: 'CS',
        },
        { id: 1, role: 'admin' }
      );
      await adminCreateAccount(req1, res1);
      assert.equal(res1.getStatus(), 400);
      assert.match(res1.getData().message, /at least 8 characters/i);

      // 2) Numbers only
      const { req: req2, res: res2 } = createMockReqRes(
        {
          name: 'Faculty User',
          email: 'fac@psu.edu.ph',
          password: '1234567890',
          role: 'faculty',
          department: 'CS',
        },
        { id: 1, role: 'admin' }
      );
      await adminCreateAccount(req2, res2);
      assert.equal(res2.getStatus(), 400);
      assert.match(res2.getData().message, /mix of letters and numbers/i);
    });

    it('REJECTS weak password on Password Reset (/api/auth/reset-password)', async () => {
      // 1) Length < 8
      const { req: req1, res: res1 } = createMockReqRes({
        token: 'valid-reset-token',
        password: 'short',
        confirmPassword: 'short',
      });
      await resetPassword(req1, res1);
      assert.equal(res1.getStatus(), 400);
      assert.match(res1.getData().message, /at least 8 characters/i);

      // 2) No numbers
      const { req: req2, res: res2 } = createMockReqRes({
        token: 'valid-reset-token',
        password: 'allletterslong',
        confirmPassword: 'allletterslong',
      });
      await resetPassword(req2, res2);
      assert.equal(res2.getStatus(), 400);
      assert.match(res2.getData().message, /mix of letters and numbers/i);
    });

    it('REJECTS weak new password on Change Password (/api/auth/change-password)', async () => {
      // 1) Length < 8
      const { req: req1, res: res1 } = createMockReqRes(
        {
          currentPassword: 'OldPassword123',
          newPassword: 'short',
        },
        { id: 10, role: 'faculty' }
      );
      await changePassword(req1, res1);
      assert.equal(res1.getStatus(), 400);
      assert.match(res1.getData().message, /at least 8 characters/i);

      // 2) Missing numbers
      const { req: req2, res: res2 } = createMockReqRes(
        {
          currentPassword: 'OldPassword123',
          newPassword: 'NoNumbersInThisNewPass',
        },
        { id: 10, role: 'faculty' }
      );
      await changePassword(req2, res2);
      assert.equal(res2.getStatus(), 400);
      assert.match(res2.getData().message, /mix of letters and numbers/i);
    });
  });

  describe('3. Existing Users Not Locked Out (Policy applies to new passwords only)', () => {
    it('allows an existing user with a legacy short/weak password to log in successfully', async () => {
      const legacyPassword = 'old';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(legacyPassword, salt);

      User.findByEmail = async (email) => {
        if (email === 'legacy@psu.edu.ph') {
          return {
            id: 99,
            name: 'Legacy User',
            email: 'legacy@psu.edu.ph',
            password: hashedPassword,
            role: 'faculty',
            email_verified: 1,
            department: 'CS',
          };
        }
        return null;
      };

      const { req, res } = createMockReqRes({
        email: 'legacy@psu.edu.ph',
        password: 'old',
      });

      await login(req, res);
      assert.equal(res.getStatus(), 200);
      assert.ok(res.getData().token, 'Token must be issued even for legacy passwords');
      assert.equal(res.getData().user.email, 'legacy@psu.edu.ph');
    });
  });

  describe('4. Token Expiration Policy (JWT_EXPIRES_IN)', () => {
    it('defaults to 8h session expiration when not explicitly overridden', () => {
      const fs = require('fs');
      const authControllerContent = fs.readFileSync(
        require.resolve('../controllers/authController'),
        'utf8'
      );
      assert.ok(
        authControllerContent.includes("expiresIn: process.env.JWT_EXPIRES_IN || '8h'"),
        'Default token expiration must be 8h'
      );
    });

    it('documents JWT_EXPIRES_IN=8h in .env.example', () => {
      const fs = require('fs');
      const envExample = fs.readFileSync(
        require.resolve('../.env.example'),
        'utf8'
      );
      assert.ok(
        envExample.includes('JWT_EXPIRES_IN=8h'),
        '.env.example must document JWT_EXPIRES_IN=8h'
      );
    });
  });
});
