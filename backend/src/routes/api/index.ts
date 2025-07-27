import { Router } from 'express';
import walletRoutes from './wallet.routes';

const router = Router();

router.use('/wallet', walletRoutes);

export default router;
