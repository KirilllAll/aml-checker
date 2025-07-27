// Адаптер для работы с сетью Ethereum
// Здесь реализуются методы валидации адреса и метаданные сети

import { WalletAdapter } from "../types/wallet-adapter";
import { isAddress } from "ethers";

export class EthereumAdapter extends WalletAdapter {
  readonly network = "ethereum";
  readonly title = "Ethereum";
  readonly icon = "ethereum";

  async validateAddress(address: string): Promise<boolean> {
    return isAddress(address);
  }
}
