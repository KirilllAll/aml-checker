// Сервис для определения сети по адресу и получения адаптера
import { EthereumAdapter } from "../adapters/ethereum.adapter";
import { BitcoinAdapter } from "../adapters/bitcoin.adapter";
import { SolanaAdapter } from "../adapters/solana.adapter";
import { WalletAdapter } from "../types/wallet-adapter";

export type Network = "ethereum" | "bitcoin" | "solana";

export class NetworkDetector {
  private readonly adapters: Record<Network, WalletAdapter>;

  constructor() {
    this.adapters = {
      ethereum: new EthereumAdapter(),
      bitcoin: new BitcoinAdapter(),
      solana: new SolanaAdapter(),
    };
  }

  /**
   * Detects the network based on address format
   */
  private detectNetwork(address: string): Network | null {
    // Bitcoin addresses typically start with 1, 3, or bc1
    if (/^(1|3|bc1)/.test(address)) {
      return "bitcoin";
    }

    // Ethereum addresses are 42 chars long and start with 0x
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return "ethereum";
    }

    // If not Bitcoin or Ethereum, try Solana
    // This is a simplified check - in reality, we should use the Solana SDK
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      return "solana";
    }

    return null;
  }

  /**
   * Gets the adapter for a specific network
   */
  private getAdapter(network: Network): WalletAdapter {
    const adapter = this.adapters[network];
    if (!adapter) {
      throw new Error(`No adapter found for network: ${network}`);
    }
    return adapter;
  }

  /**
   * Detects the network and validates the address
   */
  async detectAndValidate(address: string): Promise<{
    network: Network;
    isValid: boolean;
    icon: string;
    title: string;
  }> {
    const network = this.detectNetwork(address);
    if (!network) {
      throw new Error("Unknown network");
    }

    const adapter = this.getAdapter(network);
    const isValid = await adapter.validateAddress(address);

    return {
      network,
      isValid,
      icon: adapter.icon,
      title: adapter.title,
    };
  }
}
