import { WalletAdapter } from "../types/wallet-adapter";
import * as bitcoin from "bitcoinjs-lib";

export class BitcoinAdapter extends WalletAdapter {
  readonly network = "bitcoin";
  readonly title = "Bitcoin";
  readonly icon = "bitcoin";

  async validateAddress(address: string): Promise<boolean> {
    try {
      // Try to decode the address - will throw if invalid
      bitcoin.address.toOutputScript(address);
      return true;
    } catch (error) {
      return false;
    }
  }
}
