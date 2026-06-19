const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .matches(/@(gmail|yahoo|outlook|hotmail|icloud)\.com$/i).withMessage('Email must be a Gmail, Yahoo, Outlook, Hotmail, or iCloud address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .matches(/@(gmail|yahoo|outlook|hotmail|icloud)\.com$/i).withMessage('Email must be a Gmail, Yahoo, Outlook, Hotmail, or iCloud address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const otpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .matches(/@(gmail|yahoo|outlook|hotmail|icloud)\.com$/i).withMessage('Email must be a Gmail, Yahoo, Outlook, Hotmail, or iCloud address')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
];

const resendOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .matches(/@(gmail|yahoo|outlook|hotmail|icloud)\.com$/i).withMessage('Email must be a Gmail, Yahoo, Outlook, Hotmail, or iCloud address')
    .normalizeEmail(),
];

module.exports = {
  registerValidation,
  loginValidation,
  otpValidation,
  resendOtpValidation,
};
