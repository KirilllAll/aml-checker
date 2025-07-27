// Интерфейс для адаптеров разных блокчейн-сетей
export abstract class WalletAdapter {
  abstract readonly network: string;
  abstract readonly title: string;
  abstract readonly icon: string;

  abstract validateAddress(address: string): Promise<boolean>;
}
