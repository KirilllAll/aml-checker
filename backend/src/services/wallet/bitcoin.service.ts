import axios from 'axios';
import { logger } from '../../config/logger';
import { config } from '../../config';
import { WalletInfo } from '../../types/wallet-info';
import { BlockCypherAddressResponse } from '../../types/blockcypher.types';
import { CacheService } from '../cache.service';

export class BitcoinService {
  private static readonly BASE_URL = 'https://api.blockcypher.com/v1/btc/main';
  private static readonly cache = CacheService.getInstance();

  public static async validateAddress(address: string): Promise<boolean> {
    // Базовая валидация Bitcoin адреса
    const bitcoinAddressRegex =
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[ac-hj-np-zAC-HJ-NP-Z02-9]{11,71}$/;
    return bitcoinAddressRegex.test(address);
  }

  private static async getBTCPrice(): Promise<number> {
    const cacheKey = 'btc_price_usd';

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
              ids: 'bitcoin',
              vs_currencies: 'usd',
            },
          });
          return response.data.bitcoin.usd;
        } catch (error) {
          logger.error('Error fetching BTC price:', error);
          return 0;
        }
      },
      60, // Cache for 1 minute
    );
  }

  public static async getWalletInfo(address: string): Promise<WalletInfo> {
    const cacheKey = `bitcoin:${address}`;
    const btcPrice = await this.getBTCPrice();

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await axios.get<BlockCypherAddressResponse>(
            `${this.BASE_URL}/addrs/${address}/full`,
            {
              params: {
                token: config.blockCypherToken,
              },
            },
          );

          const { balance, n_tx, txrefs = [] } = response.data;

          // Конвертируем баланс из сатоши в BTC
          const balanceBTC = (balance / 1e8).toString();
          const balanceUSD = ((balance / 1e8) * btcPrice).toFixed(2);

          // Сортируем транзакции по времени
          const sortedTxs = [...txrefs].sort(
            (a, b) => new Date(b.confirmed).getTime() - new Date(a.confirmed).getTime(),
          );

          return {
            address,
            network: 'bitcoin',
            balance: balanceBTC,
            balanceUSD,
            txCount: n_tx,
            firstTxTimestamp: sortedTxs[sortedTxs.length - 1]?.confirmed,
            lastTxTimestamp: sortedTxs[0]?.confirmed,
            riskScore: 0,
            riskFlags: [],
            labels: [],
            tags: [],
            notes: [],
            recentTransactions: sortedTxs.slice(0, 10).map((tx) => ({
              hash: tx.tx_hash,
              timestamp: tx.confirmed,
              type: tx.tx_input_n === -1 ? ('incoming' as const) : ('outgoing' as const),
              amount: Math.abs(tx.value / 1e8).toString(),
              amountUSD: (Math.abs(tx.value / 1e8) * btcPrice).toFixed(2),
            })),
          };
        } catch (error) {
          logger.error('Error fetching Bitcoin address info:', {
            error,
            address,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      300, // Cache for 5 minutes
    );
  }
}
