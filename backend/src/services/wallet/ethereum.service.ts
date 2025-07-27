import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import axios from 'axios';
import { config } from '../../config';
import { WalletInfo } from '../../types/wallet-info';
import {
  EtherscanResponse,
  EtherscanTransaction,
  EtherscanTokenTransfer,
} from '../../types/etherscan.types';
import { AppError } from '../../middleware/error-handler';
import { logger } from '../../config/logger';
import { CacheService } from '../cache.service';

interface WalletPattern {
  type: string;
  label: string;
  description: string;
  matchScore: (stats: WalletStats) => number;
}

interface WalletStats {
  balance: number;
  txCount: number;
  avgTxValue: number;
  uniqueCounterparties: number;
  incomingCount: number;
  outgoingCount: number;
  contractInteractions: number;
  hasTokenTransfers: boolean;
  age: number; // в днях
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUSD?: string;
  lastTransferTimestamp?: string;
  transferCount: number;
}

export class EthereumService {
  private static readonly BASE_URL = 'https://api.etherscan.io/api';
  private static readonly cache = CacheService.getInstance();
  private static lastRequestTime = 0;
  private static readonly MIN_REQUEST_INTERVAL = 500; // 500ms between requests (max 2 per second)

  private static readonly WALLET_PATTERNS: WalletPattern[] = [
    {
      type: 'exchange',
      label: 'Exchange Wallet',
      description: 'High volume, many counterparties, regular activity',
      matchScore: (stats: WalletStats) => {
        let score = 0;
        if (stats.uniqueCounterparties > 1000) score += 40;
        if (stats.txCount > 1000) score += 30;
        if (stats.incomingCount > 100 && stats.outgoingCount > 100) score += 20;
        if (stats.balance > 1000) score += 10;
        return score;
      },
    },
    {
      type: 'smart_contract',
      label: 'Smart Contract',
      description: 'High contract interactions, token transfers',
      matchScore: (stats: WalletStats) => {
        let score = 0;
        if (stats.contractInteractions > 100) score += 40;
        if (stats.hasTokenTransfers) score += 30;
        if (stats.txCount > 500) score += 20;
        if (stats.uniqueCounterparties > 100) score += 10;
        return score;
      },
    },
    {
      type: 'whale',
      label: 'Whale Wallet',
      description: 'Large balance, high value transactions',
      matchScore: (stats: WalletStats) => {
        let score = 0;
        if (stats.balance > 10000) score += 40;
        if (stats.avgTxValue > 1000) score += 30;
        if (stats.txCount < 100) score += 20;
        if (stats.uniqueCounterparties < 50) score += 10;
        return score;
      },
    },
    {
      type: 'active_trader',
      label: 'Active Trader',
      description: 'Regular trading activity, moderate balance',
      matchScore: (stats: WalletStats) => {
        let score = 0;
        if (stats.txCount > 100 && stats.txCount < 1000) score += 40;
        if (stats.uniqueCounterparties > 50 && stats.uniqueCounterparties < 500) score += 30;
        if (stats.balance > 10 && stats.balance < 1000) score += 20;
        if (Math.abs(stats.incomingCount - stats.outgoingCount) < 20) score += 10;
        return score;
      },
    },
  ];

  public static async validateAddress(address: string): Promise<boolean> {
    return ethers.isAddress(address);
  }

  private static async analyzeTokens(
    tokenTransfers: EtherscanTokenTransfer[],
    _ethPrice: number, // Prefix with underscore since it's unused
  ): Promise<Token[]> {
    // Group token transfers by contract address
    const tokenMap = new Map<
      string,
      {
        symbol: string;
        name: string;
        transfers: EtherscanTokenTransfer[];
        balance: BigNumber;
      }
    >();

    tokenTransfers.forEach((transfer) => {
      const key = transfer.contractAddress.toLowerCase();
      const current = tokenMap.get(key) || {
        symbol: transfer.tokenSymbol,
        name: transfer.tokenName,
        transfers: [],
        balance: new BigNumber(0),
      };

      current.transfers.push(transfer);

      // Обновляем баланс
      const amount = new BigNumber(transfer.value).dividedBy(10 ** parseInt(transfer.tokenDecimal));
      if (transfer.to.toLowerCase() === transfer.contractAddress.toLowerCase()) {
        current.balance = current.balance.plus(amount);
      } else {
        current.balance = current.balance.minus(amount);
      }

      tokenMap.set(key, current);
    });

    // Преобразуем в массив и получаем цены токенов
    const tokens: Token[] = await Promise.all(
      Array.from(tokenMap.entries()).map(async ([address, data]) => {
        let balanceUSD: string | undefined;

        try {
          // Пытаемся получить цену токена через CoinGecko
          const response = await axios.get(
            'https://api.coingecko.com/api/v3/simple/token_price/ethereum',
            {
              params: {
                contract_addresses: address,
                vs_currencies: 'usd',
              },
            },
          );

          if (response.data[address]?.usd) {
            balanceUSD = (data.balance.toNumber() * response.data[address].usd).toFixed(2);
          }
        } catch (error) {
          logger.debug(`Failed to fetch price for token ${data.symbol}:`, error);
        }

        const lastTransfer = data.transfers[0];
        return {
          address,
          symbol: data.symbol,
          name: data.name,
          balance: data.balance.toString(),
          balanceUSD,
          lastTransferTimestamp: lastTransfer
            ? new Date(parseInt(lastTransfer.timeStamp) * 1000).toISOString()
            : undefined,
          transferCount: data.transfers.length,
        };
      }),
    );

    // Сортируем по количеству транзакций
    return tokens.sort((a, b) => b.transferCount - a.transferCount);
  }

  public static async getWalletInfo(address: string): Promise<WalletInfo> {
    try {
      // Получаем все данные параллельно
      const [balance, transactions, tokenTransfers, ethPrice] = await Promise.all([
        this.makeRequest<string>({
          module: 'account',
          action: 'balance',
          address,
          tag: 'latest',
        }),
        this.makeRequest<EtherscanTransaction[]>({
          module: 'account',
          action: 'txlist',
          address,
          startblock: '0',
          endblock: '99999999',
          page: '1',
          offset: '100',
          sort: 'desc',
        }),
        this.makeRequest<EtherscanTokenTransfer[]>({
          module: 'account',
          action: 'tokentx',
          address,
          page: '1',
          offset: '100',
          sort: 'desc',
        }).catch(() => [] as EtherscanTokenTransfer[]),
        this.getETHPrice(),
      ]);

      // Анализируем токены
      const tokens = await this.analyzeTokens(tokenTransfers, ethPrice);

      // Конвертируем баланс из Wei в ETH
      const balanceETH = ethers.formatEther(balance);
      const balanceUSD = (parseFloat(balanceETH) * ethPrice).toFixed(2);

      // Собираем статистику
      const stats = this.analyzeWallet(address, transactions, tokenTransfers);

      // Определяем тип кошелька
      const walletType = this.detectWalletType(stats);

      // Анализируем риски
      const { riskScore, riskFlags, notes } = this.analyzeRisks(stats, transactions);

      // Базовая информация о кошельке
      const info: WalletInfo = {
        address,
        network: 'ethereum',
        balance: balanceETH,
        balanceUSD,
        txCount: transactions.length,
        tokenCount: tokens.length,
        firstTxTimestamp: transactions[transactions.length - 1]?.timeStamp
          ? new Date(parseInt(transactions[transactions.length - 1].timeStamp) * 1000).toISOString()
          : undefined,
        lastTxTimestamp: transactions[0]?.timeStamp
          ? new Date(parseInt(transactions[0].timeStamp) * 1000).toISOString()
          : undefined,
        riskScore,
        riskFlags,
        labels: [walletType.label],
        tags: [walletType.type],
        notes: [...notes, walletType.description],
        tokens,
        recentTransactions: [
          ...transactions.slice(0, 5).map((tx) => ({
            hash: tx.hash,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            type:
              tx.from.toLowerCase() === address.toLowerCase()
                ? ('outgoing' as const)
                : ('incoming' as const),
            amount: ethers.formatEther(tx.value),
            amountUSD: (parseFloat(ethers.formatEther(tx.value)) * ethPrice).toFixed(2),
          })),
          ...tokenTransfers.slice(0, 5).map((tx) => ({
            hash: tx.hash,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            type:
              tx.to.toLowerCase() === address.toLowerCase()
                ? ('incoming' as const)
                : ('outgoing' as const),
            amount: (parseInt(tx.value) / 10 ** parseInt(tx.tokenDecimal)).toString(),
            tokenSymbol: tx.tokenSymbol,
            tokenAddress: tx.contractAddress,
          })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      };

      return info;
    } catch (error) {
      logger.error('Error fetching Ethereum wallet info:', {
        error,
        address,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private static async makeRequest<T>(params: Record<string, string>): Promise<T> {
    try {
      // Добавляем задержку, если необходимо
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest),
        );
      }
      this.lastRequestTime = Date.now();

      const fullParams = {
        ...params,
        apikey: config.etherscanToken || '', // Добавляем дефолтное значение
      };

      // Логируем полный URL с параметрами
      const url = new URL(config.etherscanUrl); // Используем URL из конфига
      Object.entries(fullParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      logger.debug('Making Etherscan API request:', {
        url: url.toString(),
        params: fullParams,
        token: config.etherscanToken?.slice(0, 6) + '...', // Логируем только начало токена
      });

      const response = await axios.get<EtherscanResponse<T>>(config.etherscanUrl, {
        params: fullParams,
      });

      logger.debug('Etherscan API response:', {
        status: response.data.status,
        message: response.data.message,
        resultType: typeof response.data.result,
        resultPreview: JSON.stringify(response.data.result).slice(0, 100),
        fullResponse: response.data, // Временно логируем полный ответ
      });

      // Проверяем статус и сообщение
      if (response.data.status !== '1' || response.data.message !== 'OK') {
        logger.error('Etherscan API error response:', {
          status: response.data.status,
          message: response.data.message,
          params: fullParams,
        });

        // Если превышен rate limit, пробуем еще раз после задержки
        if (response.data.message?.includes('rate limit')) {
          logger.info('Rate limit hit, retrying after delay...');
          await new Promise((resolve) => setTimeout(resolve, this.MIN_REQUEST_INTERVAL));
          return this.makeRequest(params);
        }

        throw new AppError(502, `Etherscan API error: ${response.data.message}`);
      }

      if (!response.data.result) {
        logger.error('Etherscan API empty result:', response.data);
        throw new AppError(502, 'Etherscan API returned empty result');
      }

      return response.data.result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Etherscan API error:', {
        error,
        params,
        message: error instanceof Error ? error.message : 'Unknown error',
        url: config.etherscanUrl,
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new AppError(502, 'Failed to fetch data from Etherscan');
    }
  }

  private static async getETHPrice(): Promise<number> {
    const cacheKey = 'eth_price_usd';

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
              ids: 'ethereum',
              vs_currencies: 'usd',
            },
          });
          return response.data.ethereum.usd;
        } catch (error) {
          logger.error('Error fetching ETH price:', error);
          return 0;
        }
      },
      60, // Кэшируем на 1 минуту
    );
  }

  private static analyzeWallet(
    address: string,
    transactions: EtherscanTransaction[],
    tokenTransfers: EtherscanTokenTransfer[],
  ): WalletStats {
    const addressLower = address.toLowerCase();
    const counterparties = new Set<string>();
    let incomingCount = 0;
    let outgoingCount = 0;
    let totalValue = 0;
    let contractInteractions = 0;

    transactions.forEach((tx) => {
      counterparties.add(tx.from.toLowerCase());
      counterparties.add(tx.to.toLowerCase());

      const value = parseFloat(ethers.formatEther(tx.value));
      totalValue += value;

      if (tx.from.toLowerCase() === addressLower) {
        outgoingCount++;
        if (tx.input && tx.input !== '0x') {
          contractInteractions++;
        }
      } else {
        incomingCount++;
      }
    });

    // Удаляем свой адрес из списка контрагентов
    counterparties.delete(addressLower);

    const firstTx = transactions[transactions.length - 1];
    const lastTx = transactions[0];
    const age =
      firstTx && lastTx
        ? (parseInt(lastTx.timeStamp) - parseInt(firstTx.timeStamp)) / (24 * 60 * 60)
        : 0;

    return {
      balance: parseFloat(ethers.formatEther(transactions[0]?.value || '0')),
      txCount: transactions.length,
      avgTxValue: totalValue / transactions.length,
      uniqueCounterparties: counterparties.size,
      incomingCount,
      outgoingCount,
      contractInteractions,
      hasTokenTransfers: tokenTransfers.length > 0,
      age,
    };
  }

  private static detectWalletType(stats: WalletStats): WalletPattern {
    let bestMatch = this.WALLET_PATTERNS[0];
    let highestScore = 0;

    for (const pattern of this.WALLET_PATTERNS) {
      const score = pattern.matchScore(stats);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    return bestMatch;
  }

  private static analyzeRisks(
    stats: WalletStats,
    _transactions: EtherscanTransaction[], // Prefix unused param with underscore
  ): {
    riskScore: number;
    riskFlags: string[];
    notes: string[];
  } {
    const riskFlags: string[] = [];
    const notes: string[] = [];

    // Проверяем объем транзакций
    if (stats.avgTxValue > 10000) {
      riskFlags.push('very_high_value_tx');
      notes.push('Very high average transaction value (>10k ETH)');
    } else if (stats.avgTxValue > 1000) {
      riskFlags.push('high_value_tx');
      notes.push('High average transaction value (>1k ETH)');
    }

    // Проверяем возраст кошелька
    if (stats.age < 30) {
      riskFlags.push('new_wallet');
      notes.push('Wallet is less than 30 days old');
    }

    // Проверяем паттерны транзакций
    if (stats.incomingCount === 0 && stats.outgoingCount > 10) {
      riskFlags.push('suspicious_pattern');
      notes.push('Only outgoing transactions, possible money laundering');
    }

    if (stats.uniqueCounterparties < 3 && stats.txCount > 10) {
      riskFlags.push('limited_counterparties');
      notes.push('High number of transactions with very few counterparties');
    }

    // Проверяем контрактные взаимодействия
    if (stats.contractInteractions > 50) {
      riskFlags.push('high_contract_usage');
      notes.push('High number of contract interactions');
    }

    // Рассчитываем итоговый риск-скор
    const riskScore = Math.min(
      Math.floor(
        riskFlags.length * 20 + // Базовый скор за каждый флаг
          (stats.avgTxValue > 1000 ? 20 : 0) + // Дополнительные баллы за высокие суммы
          (stats.age < 30 ? 20 : 0) + // Дополнительные баллы за новые кошельки
          (stats.uniqueCounterparties < 3 ? 20 : 0), // Дополнительные баллы за малое число контрагентов
      ),
      100,
    );

    return { riskScore, riskFlags, notes };
  }

  private static analyzeContractInteractions(transactions: EtherscanTransaction[]): {
    uniqueContracts: number;
    hasComplexTx: boolean;
  } {
    const contracts = new Set<string>();
    let hasComplexTx = false;

    for (const tx of transactions) {
      // Проверяем взаимодействие с контрактами
      if (tx.input !== '0x' && tx.input.length > 10) {
        contracts.add(tx.to.toLowerCase());

        // Проверяем сложные транзакции (длинный input data)
        if (tx.input.length > 1000) {
          hasComplexTx = true;
        }
      }
    }

    return {
      uniqueContracts: contracts.size,
      hasComplexTx,
    };
  }

  private static calculateRiskScore(params: {
    balance: number;
    txCount: number;
    tokenCount: number;
    firstSeen?: string;
    knownType?: string;
    knownRisk?: number;
    hasFailedTx: boolean;
    contractInteractions: {
      uniqueContracts: number;
      hasComplexTx: boolean;
    };
  }): number {
    let score = 0;

    // Если адрес известный, используем его риск как базовый
    if (params.knownRisk !== undefined) {
      score = params.knownRisk;
    }

    // Новый адрес (менее 30 дней)
    if (params.firstSeen) {
      const accountAge = Date.now() - Number(params.firstSeen) * 1000;
      if (accountAge < 30 * 24 * 60 * 60 * 1000) {
        score += 20;
      }
    }

    // Малое количество транзакций
    if (params.txCount < 10) {
      score += 10;
    }

    // Большой баланс
    if (params.balance > 100) {
      score += 15;
    }

    // Много разных токенов
    if (params.tokenCount > 50) {
      score += 10;
    }

    // Неудачные транзакции
    if (params.hasFailedTx) {
      score += 5;
    }

    // Сложные контрактные взаимодействия
    if (params.contractInteractions.uniqueContracts > 20) {
      score += 10;
    }
    if (params.contractInteractions.hasComplexTx) {
      score += 5;
    }

    // Известный тип
    if (params.knownType === 'mixer') {
      score = Math.max(score, 90); // Миксеры всегда высокорисковые
    }

    return Math.min(score, 100);
  }

  private static getRiskFlags(score: number): string[] {
    const flags: string[] = [];

    if (score >= 80) {
      flags.push('VERY_HIGH_RISK');
    } else if (score >= 60) {
      flags.push('HIGH_RISK');
    } else if (score >= 40) {
      flags.push('MEDIUM_RISK');
    } else if (score >= 20) {
      flags.push('LOW_RISK');
    }

    return flags;
  }
}
