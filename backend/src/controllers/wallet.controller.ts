import { Request, Response, NextFunction } from 'express';
import { BitcoinService } from '../services/wallet/bitcoin.service';
import { EthereumService } from '../services/wallet/ethereum.service';
import { SolanaService } from '../services/wallet/solana.service';
import { AppError } from '../middleware/error-handler';
import { logger } from '../config/logger';

export class WalletController {
  public static async validateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.body;

      // Try to validate address for each network
      const services = [
        { service: BitcoinService, network: 'bitcoin' },
        { service: EthereumService, network: 'ethereum' },
        { service: SolanaService, network: 'solana' },
      ];

      for (const { service, network } of services) {
        try {
          const isValid = await service.validateAddress(address);
          if (isValid) {
            return res.json({
              network,
              isValid: true,
              icon: network,
              title: network.charAt(0).toUpperCase() + network.slice(1),
            });
          }
        } catch (error) {
          logger.debug(`Failed to validate ${network} address:`, error);
        }
      }

      // If no network validated the address
      throw new AppError(400, 'Invalid address format');
    } catch (error) {
      next(error);
    }
  }

  public static async getWalletInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { address, network } = req.body;

      let walletInfo;
      switch (network.toLowerCase()) {
        case 'bitcoin':
          walletInfo = await BitcoinService.getWalletInfo(address);
          break;
        case 'ethereum':
          walletInfo = await EthereumService.getWalletInfo(address);
          break;
        case 'solana':
          walletInfo = await SolanaService.getWalletInfo(address);
          break;
        default:
          throw new AppError(400, `Unsupported network: ${network}`);
      }

      res.json(walletInfo);
    } catch (error) {
      next(error);
    }
  }
}
