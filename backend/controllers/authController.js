const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');
require('dotenv').config();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

/**
 * POST /api/auth/register
 * Register a new account
 */
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, year_level, section, department, subject_id } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Student-specific validation
    if (role === 'student') {
      if (!year_level || !section || !department || !subject_id) {
        return res.status(400).json({ message: 'Year level, section, department, and subject are required for students.' });
      }
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (!email.endsWith('@psu.edu.ph')) {
      return res.status(400).json({ message: 'Only PSU email addresses (@psu.edu.ph) are allowed.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const validRoles = ['faculty', 'student'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    // Check if account already exists
    const existingAccount = await User.findByEmail(email);
    if (existingAccount) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create account
    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      verification_token: verificationToken,
      year_level: role === 'student' ? year_level : null,
      section: role === 'student' ? section : null,
      department: role === 'student' ? department : department || null,
      subject_id: subject_id || null,
    });

    // Send verification email
    try {
      console.log(`[EMAIL] Sending verification email to: ${email}`);
      await sendVerificationEmail(email, verificationToken);
      console.log(`[EMAIL] Verification email sent successfully to: ${email}`);
    } catch (emailError) {
      console.error(`[EMAIL] Failed to send to ${email}:`, emailError.message);
      // Continue registration even if email fails
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * POST /api/auth/login
 * Login account
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find account
    const account = await User.findByEmail(email);
    if (!account) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check if email is verified
    if (!account.email_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate token
    const token = generateToken(account);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        year_level: account.year_level,
        section: account.section,
        department: account.department,
        subject_id: account.subject_id || null,
        subject_code: account.subject_code || null,
        subject_name: account.subject_name || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

/**
 * GET /api/auth/verify-email/:token
 * Verify account email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const account = await User.findByVerificationToken(token);
    if (!account) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    await User.verifyEmail(account.id, account.role);

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification.' });
  }
};

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const account = await User.findByEmail(email);
    if (!account) {
      // Return success even if email doesn't exist (security best practice)
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token
    await PasswordReset.create({
      email,
      token: resetToken,
      expires_at: expiresAt,
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError.message);
    }

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * POST /api/auth/reset-password
 * Reset user password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Find valid reset token
    const resetRecord = await PasswordReset.findByToken(token);
    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    await User.updatePassword(resetRecord.email, hashedPassword);

    // Delete used token
    await PasswordReset.deleteByEmail(resetRecord.email);

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
};

/**
 * GET /api/auth/me
 * Get current account profile
 */
const getProfile = async (req, res) => {
  try {
    const account = await User.findById(req.user.id, req.user.role);
    if (!account) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: account });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const account = await User.findById(req.user.id, req.user.role);

    const userWithPassword = await User.findByEmail(account.email);
    if (!userWithPassword) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, userWithPassword.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.updatePassword(account.email, hashedPassword);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword,
};
