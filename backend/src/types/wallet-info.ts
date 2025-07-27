export interface Token {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUSD?: string;
  lastTransferTimestamp?: string;
  transferCount: number;
}

export interface Transaction {
  hash: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  amount: string;
  amountUSD?: string;
  tokenSymbol?: string;
  tokenAddress?: string;
}

export interface WalletInfo {
  address: string;
  network: string;
  balance: string;
  balanceUSD?: string;
  txCount: number;
  tokenCount?: number;
  firstTxTimestamp?: string;
  lastTxTimestamp?: string;
  riskScore: number;
  riskFlags: string[];
  labels: string[];
  tags: string[];
  notes: string[];
  tokens?: Token[];
  recentTransactions: Transaction[];
}

// API Response types for different services
export interface BlockCypherAddressResponse {
  address: string;
  total_received: number;
  total_sent: number;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  n_tx: number;
  unconfirmed_n_tx: number;
  final_n_tx: number;
  txrefs?: {
    tx_hash: string;
    block_height: number;
    tx_input_n: number;
    tx_output_n: number;
    value: number;
    ref_balance: number;
    confirmations: number;
    confirmed: string;
    double_spend: boolean;
  }[];
}

// Error handling
export enum WalletInfoError {
  NOT_FOUND = 'Account not found',
  RATE_LIMIT = 'API rate limit exceeded',
  NETWORK_ERROR = 'Network error',
  INVALID_RESPONSE = 'Invalid API response',
  UNSUPPORTED_NETWORK = 'Network not supported',
}

export class WalletInfoException extends Error {
  constructor(
    public readonly code: WalletInfoError,
    public readonly details?: string,
  ) {
    super(code);
    this.name = 'WalletInfoException';
  }
}
