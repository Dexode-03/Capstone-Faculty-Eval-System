/**
 * Password Policy Validator (Task 3B.8 / NFR-01)
 *
 * Rules:
 *   1. Minimum length of 8 characters
 *   2. Must contain at least one letter [a-zA-Z]
 *   3. Must contain at least one number [0-9]
 *
 * Applies to:
 *   - User registration (/api/auth/register)
 *   - Admin account creation (/api/auth/admin/accounts)
 *   - Password reset (/api/auth/reset-password)
 *   - Change password (/api/auth/change-password)
 *   - Faculty creation (/api/faculty)
 *
 * Note: Existing users are NOT locked out; policy applies exclusively to new passwords.
 */

const PASSWORD_MIN_LENGTH = 8;

const validatePasswordPolicy = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required.',
    };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain a mix of letters and numbers.',
    };
  }

  return { isValid: true };
};

module.exports = {
  PASSWORD_MIN_LENGTH,
  validatePasswordPolicy,
};
