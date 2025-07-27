export interface EtherscanResponse<T> {
  status: string;
  message: string;
  result: T;
}

export interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  input: string;
  methodId: string;
  functionName: string;
  contractAddress: string;
  isError: string;
  confirmations: string;
}

export interface EtherscanTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  gasUsed: string;
  gasPrice: string;
  confirmations: string;
}

export interface EtherscanTokenInfo {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  divisor: string;
  tokenType: string;
  totalSupply: string;
  blueCheckmark: string;
  description: string;
  website: string;
  email: string;
  blog: string;
  reddit: string;
  twitter: string;
  github: string;
  telegram: string;
  discord: string;
}

// Известные адреса и их метки
export interface KnownAddress {
  name: string;
  type: 'exchange' | 'defi' | 'mixer' | 'scam' | 'other';
  risk: number; // 0-100
  description?: string;
}

// Список известных адресов Ethereum
export const KNOWN_ETH_ADDRESSES: Record<string, KnownAddress> = {
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e': {
    name: 'Bitfinex',
    type: 'exchange',
    risk: 20,
    description: 'Bitfinex Hot Wallet',
  },
  '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE': {
    name: 'Binance',
    type: 'exchange',
    risk: 20,
    description: 'Binance Hot Wallet',
  },
  '0x8484Ef722627bf18ca5Ae6BcF031c23E6e922B30': {
    name: 'Tornado Cash',
    type: 'mixer',
    risk: 90,
    description: 'Sanctioned cryptocurrency mixer',
  },
};
