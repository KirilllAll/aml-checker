import axios from "axios";
import {
  WalletInfo,
  BlockCypherAddressResponse,
  WalletInfoError,
  WalletInfoException,
} from "../types/wallet-info";
import { WalletInfoNormalizer } from "./wallet-info-normalizer.service";

export class BitcoinInfoService {
  private static readonly BASE_URL = "https://api.blockcypher.com/v1/btc/main";

  /**
   * Fetches wallet information from BlockCypher API
   * @param address Bitcoin address to check
   * @returns Normalized wallet information
   * @throws WalletInfoException if the request fails or response is invalid
   */
  static async getWalletInfo(address: string): Promise<WalletInfo> {
    try {
      const response = await axios.get<BlockCypherAddressResponse>(
        `${this.BASE_URL}/addrs/${address}`,
        {
          params: {
            limit: 10, // Get last 10 transactions
            confirmations: 0, // Include unconfirmed transactions
          },
        }
      );

      // Normalize the response
      const normalizedInfo = WalletInfoNormalizer.fromBlockCypher(
        response.data
      );

      // Validate the normalized data
      WalletInfoNormalizer.validate(normalizedInfo);

      return normalizedInfo;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new WalletInfoException(WalletInfoError.NOT_FOUND);
        }
        if (error.response?.status === 429) {
          throw new WalletInfoException(WalletInfoError.RATE_LIMIT);
        }
        throw new WalletInfoException(
          WalletInfoError.NETWORK_ERROR,
          error.message
        );
      }
      throw new WalletInfoException(
        WalletInfoError.INVALID_RESPONSE,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
}
