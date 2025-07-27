import { PublicKey } from '@solana/web3.js';
import { WalletInfo } from '../../types/wallet-info';
import { AppError } from '../../middleware/error-handler';
import { logger } from '../../config/logger';

export class SolanaService {
  public static async validateAddress(address: string): Promise<boolean> {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      logger.debug('Solana address validation failed:', error);
      return false;
    }
  }

  public static async getWalletInfo(_address: string): Promise<WalletInfo> {
    throw new AppError(501, 'Solana support coming soon');
  }
}
