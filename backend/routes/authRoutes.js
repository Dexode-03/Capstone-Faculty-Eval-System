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
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Existing routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getProfile);
router.post('/change-password', authenticate, changePassword);

// Admin CRUD routes for account management
router.get('/admin/accounts', authenticate, getAllAccounts);
router.get('/admin/accounts/:id', authenticate, getAccountById);
router.post('/admin/accounts', authenticate, adminCreateAccount);
router.put('/admin/accounts/:id', authenticate, adminUpdateAccount);
router.delete('/admin/accounts/:id', authenticate, adminDeleteAccount);

module.exports = router;
