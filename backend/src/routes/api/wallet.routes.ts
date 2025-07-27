import { Router } from 'express';
import { validateRequest } from '../../middleware/request-validator';
import { walletValidationRules } from '../../utils/validators';
import { WalletController } from '../../controllers/wallet.controller';

const router = Router();

router.post(
  '/validate',
  walletValidationRules.validateAddress,
  validateRequest,
  WalletController.validateAddress,
);

router.post(
  '/info',
  walletValidationRules.getWalletInfo,
  validateRequest,
  WalletController.getWalletInfo,
);

export default router;
