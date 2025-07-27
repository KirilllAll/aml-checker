export interface WalletInfo {
  // Basic info
  address: string;
  network: string;
  balance: string;
  balanceUSD?: string;

  // Transaction info
  txCount: number;
  firstTxTimestamp?: string;
  lastTxTimestamp?: string;

  // Risk assessment
  riskScore?: number; // 0-100, where 100 is highest risk
  riskFlags?: string[];

  // Additional data
  labels?: string[]; // e.g. "exchange", "mixer", "gambling"
  tags?: string[]; // Additional context tags
  notes?: string[]; // Any additional information

  // Token balances (for ETH/SOL)
  tokens?: {
    symbol: string;
    balance: string;
    balanceUSD?: string;
  }[];

  // Recent transactions
  recentTransactions?: {
    hash: string;
    timestamp: string;
    type: "incoming" | "outgoing";
    amount: string;
    amountUSD?: string;
  }[];
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
  NOT_FOUND = "Account not found",
  RATE_LIMIT = "API rate limit exceeded",
  NETWORK_ERROR = "Network error",
  INVALID_RESPONSE = "Invalid API response",
  UNSUPPORTED_NETWORK = "Network not supported",
}

export class WalletInfoException extends Error {
  constructor(
    public readonly code: WalletInfoError,
    public readonly details?: string
  ) {
    super(code);
    this.name = "WalletInfoException";
  }
}
