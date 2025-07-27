import {
  WalletInfo,
  BlockCypherAddressResponse,
  WalletInfoError,
  WalletInfoException,
} from "../types/wallet-info";

export class WalletInfoNormalizer {
  /**
   * Normalizes Bitcoin data from BlockCypher API response
   */
  static fromBlockCypher(data: BlockCypherAddressResponse): WalletInfo {
    if (!data || !data.address) {
      throw new WalletInfoException(WalletInfoError.INVALID_RESPONSE);
    }

    const recentTransactions = data.txrefs?.slice(0, 10).map((tx) => ({
      hash: tx.tx_hash,
      timestamp: tx.confirmed,
      type: tx.tx_input_n >= 0 ? ("outgoing" as const) : ("incoming" as const),
      amount: (tx.value / 1e8).toString(), // Convert satoshis to BTC
      // amountUSD will be added later when we implement price fetching
    }));

    return {
      address: data.address,
      network: "bitcoin",
      balance: (data.final_balance / 1e8).toString(), // Convert satoshis to BTC
      txCount: data.final_n_tx,
      // We'll add these when we implement historical tx fetching
      firstTxTimestamp:
        recentTransactions?.[recentTransactions.length - 1]?.timestamp,
      lastTxTimestamp: recentTransactions?.[0]?.timestamp,

      // Risk assessment - we'll expand this later
      riskScore: 0,
      riskFlags: [],

      // Additional data
      labels: [], // We'll add these when we implement address labeling
      tags: [],
      notes: [],

      recentTransactions,
    };
  }

  /**
   * Validates the normalized WalletInfo object
   * Throws WalletInfoException if validation fails
   */
  static validate(info: WalletInfo): void {
    if (!info.address || !info.network || !info.balance) {
      throw new WalletInfoException(
        WalletInfoError.INVALID_RESPONSE,
        "Missing required fields in normalized wallet info"
      );
    }

    // Validate numeric fields
    if (typeof info.txCount !== "number" || info.txCount < 0) {
      throw new WalletInfoException(
        WalletInfoError.INVALID_RESPONSE,
        "Invalid transaction count"
      );
    }

    if (
      info.riskScore !== undefined &&
      (info.riskScore < 0 || info.riskScore > 100)
    ) {
      throw new WalletInfoException(
        WalletInfoError.INVALID_RESPONSE,
        "Risk score must be between 0 and 100"
      );
    }

    // Validate timestamps if present
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    if (info.firstTxTimestamp && !timestampRegex.test(info.firstTxTimestamp)) {
      throw new WalletInfoException(
        WalletInfoError.INVALID_RESPONSE,
        "Invalid firstTxTimestamp format"
      );
    }
    if (info.lastTxTimestamp && !timestampRegex.test(info.lastTxTimestamp)) {
      throw new WalletInfoException(
        WalletInfoError.INVALID_RESPONSE,
        "Invalid lastTxTimestamp format"
      );
    }
  }
}
