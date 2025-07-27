import axios from 'axios';
import {
  WalletInfo,
  BlockCypherAddressResponse,
  WalletInfoError,
  WalletInfoException,
} from '../types/wallet-info';
import { WalletInfoNormalizer } from './wallet-info-normalizer.service';

interface KnownAddressInfo {
  labels: string[];
  tags: string[];
  notes: string[];
}

interface PriceInfo {
  bitcoin: {
    usd: number;
  };
}

export class BitcoinInfoService {
  private static readonly BASE_URL = 'https://api.blockcypher.com/v1/btc/main';

  private static readonly KNOWN_ADDRESSES: Record<string, KnownAddressInfo> = {
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': {
      labels: ['Genesis Block', 'Satoshi Nakamoto'],
      tags: ['historical', 'inactive'],
      notes: ['First Bitcoin address, recipient of the genesis block reward'],
    },
  };

  /**
   * Fetches wallet information from BlockCypher API
   */
  public static async getWalletInfo(address: string): Promise<WalletInfo> {
    try {
      // Параллельно запрашиваем данные о кошельке и текущую цену
      const [addressData, priceData] = await Promise.all([
        this.getAddressData(address),
        this.getCurrentPrice(),
      ]);

      // Нормализуем данные от BlockCypher
      let normalizedInfo = WalletInfoNormalizer.fromBlockCypher(addressData);

      // Добавляем USD эквиваленты
      normalizedInfo = this.enrichWithUsdValues(normalizedInfo, priceData.bitcoin.usd);

      // Добавляем информацию об известных адресах
      normalizedInfo = this.enrichWithKnownInfo(address, normalizedInfo);

      // Рассчитываем риск-скор
      normalizedInfo.riskScore = this.calculateRiskScore(normalizedInfo);

      // Валидируем финальные данные
      WalletInfoNormalizer.validate(normalizedInfo);

      return normalizedInfo;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new WalletInfoException(WalletInfoError.NOT_FOUND, 'Bitcoin address not found');
        }
        if (error.response?.status === 429) {
          throw new WalletInfoException(
            WalletInfoError.RATE_LIMIT,
            'BlockCypher API rate limit exceeded',
          );
        }
        throw new WalletInfoException(
          WalletInfoError.NETWORK_ERROR,
          `BlockCypher API error: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Получает данные о кошельке из BlockCypher
   */
  private static async getAddressData(address: string): Promise<BlockCypherAddressResponse> {
    const response = await axios.get<BlockCypherAddressResponse>(
      `${this.BASE_URL}/addrs/${address}`,
      {
        params: {
          limit: 10, // Получаем последние 10 транзакций
          confirmations: 0, // Включая неподтвержденные
        },
      },
    );
    return response.data;
  }

  /**
   * Получает текущую цену BTC/USD
   */
  private static async getCurrentPrice(): Promise<PriceInfo> {
    const response = await axios.get<PriceInfo>(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    );
    return response.data;
  }

  /**
   * Добавляет USD эквиваленты к балансу и транзакциям
   */
  private static enrichWithUsdValues(info: WalletInfo, btcToUsd: number): WalletInfo {
    return {
      ...info,
      balanceUSD: (Number(info.balance) * btcToUsd).toFixed(2),
      recentTransactions: info.recentTransactions?.map((tx) => ({
        ...tx,
        amountUSD: (Number(tx.amount) * btcToUsd).toFixed(2),
      })),
    };
  }

  /**
   * Добавляет информацию об известных адресах
   */
  private static enrichWithKnownInfo(address: string, info: WalletInfo): WalletInfo {
    const knownInfo = this.KNOWN_ADDRESSES[address];
    if (knownInfo) {
      return {
        ...info,
        ...knownInfo,
      };
    }
    return info;
  }

  /**
   * Рассчитывает риск-скор для адреса
   */
  private static calculateRiskScore(info: WalletInfo): number {
    let score = 0;

    // Возраст аккаунта
    const accountAge = new Date().getTime() - new Date(info.firstTxTimestamp || '').getTime();
    if (accountAge < 30 * 24 * 60 * 60 * 1000) {
      // менее 30 дней
      score += 20;
    }

    // Количество транзакций
    if (info.txCount < 10) {
      score += 10;
    }

    // Большой баланс
    if (Number(info.balance) > 100) {
      score += 15;
    }

    return Math.min(score, 100);
  }
}
