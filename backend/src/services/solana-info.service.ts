import axios from "axios";
import { WalletInfo } from "../types/wallet-info";

export class SolanaInfoService {
  static async getWalletInfo(address: string): Promise<WalletInfo> {
    const url = `https://api.blockchair.com/solana/dashboards/address/${address}`;
    let data;
    try {
      const resp = await axios.get(url);
      data = resp.data.data[address];
      if (!data) {
        throw new Error("Account not found on Blockchair");
      }
    } catch (e: any) {
      if (e.response && e.response.status === 404) {
        throw new Error("Account not found on Blockchair");
      }
      throw e;
    }

    // Баланс в SOL (lamports -> SOL)
    const lamports = data.address.balance || 0;
    const solBalance = (lamports / 1e9).toFixed(9);
    // Метки (labels)
    const labels = data.address?.tags || undefined;
    // Транзакции (Blockchair возвращает только id, без подробностей)
    const recentTransactions = (data.transactions || [])
      .slice(0, 10)
      .map((tx: string) => ({
        hash: tx,
      }));
    // Первая/последняя активность
    const firstSeen = data.address?.first_seen_receiving
      ? new Date(data.address.first_seen_receiving * 1000).toISOString()
      : undefined;
    const lastSeen = data.address?.last_seen_receiving
      ? new Date(data.address.last_seen_receiving * 1000).toISOString()
      : undefined;
    // Количество транзакций
    const txCount =
      data.address?.transaction_count || recentTransactions.length;

    // Простая оценка риска
    let risk = undefined;
    let notes = undefined;
    if (
      labels &&
      labels.some((l: string) => l.toLowerCase().includes("exchange"))
    ) {
      risk = "low";
      notes = "Адрес принадлежит бирже или сервису";
    }

    return {
      address,
      network: "solana",
      balance: `${solBalance} SOL`,
      txCount,
      firstSeen,
      lastSeen,
      labels,
      recentTransactions,
      risk,
      notes,
    };
  }
}
