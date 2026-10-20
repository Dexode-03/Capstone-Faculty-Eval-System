const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword,
  getAllAccounts,
  getAccountById,
  adminCreateAccount,
  adminUpdateAccount,
  adminDeleteAccount,
  getFacultyAssignments,
  getAllFacultyAssignments,
} = require('../controllers/authController');
const { getConsentStatus, acceptConsent } = require('../controllers/privacyConsentController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, forgotPasswordLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Authentication routes with rate limiting (Task 4.3 / NFR-01)
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getProfile);
router.post('/change-password', authenticate, changePassword);

// Privacy consent routes
router.get('/consent/status', authenticate, getConsentStatus);
router.post('/consent/accept', authenticate, acceptConsent);

// Admin CRUD routes for account management
router.get('/admin/accounts', authenticate, getAllAccounts);
router.get('/admin/accounts/:id', authenticate, getAccountById);
router.post('/admin/accounts', authenticate, adminCreateAccount);
router.put('/admin/accounts/:id', authenticate, adminUpdateAccount);
router.delete('/admin/accounts/:id', authenticate, adminDeleteAccount);
router.get('/admin/faculty-assignments', authenticate, getAllFacultyAssignments);
router.get('/admin/faculty-assignments/:id', authenticate, getFacultyAssignments);

module.exports = router;
