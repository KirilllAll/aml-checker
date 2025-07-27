import { WalletAdapter } from "../types/wallet-adapter";
import { PublicKey } from "@solana/web3.js";

export class SolanaAdapter extends WalletAdapter {
  readonly network = "solana";
  readonly title = "Solana";
  readonly icon = "solana";

  async validateAddress(address: string): Promise<boolean> {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }
}
