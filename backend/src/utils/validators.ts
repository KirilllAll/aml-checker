import { body } from 'express-validator';

export const walletValidationRules = {
  validateAddress: [
    body('address')
      .trim()
      .notEmpty()
      .withMessage('Address is required')
      .isLength({ min: 26, max: 100 })
      .withMessage('Invalid address length'),
  ],

  getWalletInfo: [
    body('address')
      .trim()
      .notEmpty()
      .withMessage('Address is required')
      .isLength({ min: 26, max: 100 })
      .withMessage('Invalid address length'),

    body('network')
      .trim()
      .notEmpty()
      .withMessage('Network is required')
      .isIn(['bitcoin', 'ethereum', 'solana'])
      .withMessage('Invalid network. Must be one of: bitcoin, ethereum, solana'),
  ],
};
