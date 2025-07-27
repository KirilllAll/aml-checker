import { Request, Response } from "express";
import { BitcoinInfoService } from "../services/bitcoin-info.service";
import { WalletInfoError, WalletInfoException } from "../types/wallet-info";

export const walletInfoController = async (req: Request, res: Response) => {
  try {
    const { address, network } = req.body;

    if (!address || !network) {
      return res.status(400).json({
        error: "Address and network are required",
      });
    }

    let walletInfo;
    switch (network.toLowerCase()) {
      case "bitcoin":
        walletInfo = await BitcoinInfoService.getWalletInfo(address);
        break;
      case "ethereum":
        // TODO: Implement Ethereum support
        return res.status(501).json({
          error: "Ethereum support coming soon",
        });
      case "solana":
        // TODO: Implement Solana support
        return res.status(501).json({
          error: "Solana support coming soon",
        });
      default:
        return res.status(400).json({
          error: `Unsupported network: ${network}`,
        });
    }

    return res.json(walletInfo);
  } catch (error) {
    if (error instanceof WalletInfoException) {
      switch (error.code) {
        case WalletInfoError.NOT_FOUND:
          return res.status(404).json({ error: "Account not found" });
        case WalletInfoError.RATE_LIMIT:
          return res.status(429).json({ error: "Rate limit exceeded" });
        case WalletInfoError.NETWORK_ERROR:
          return res.status(502).json({
            error: "Network error",
            details: error.details,
          });
        case WalletInfoError.INVALID_RESPONSE:
          return res.status(502).json({
            error: "Invalid response from upstream service",
            details: error.details,
          });
        default:
          return res.status(500).json({
            error: "Internal server error",
            details: error.details,
          });
      }
    }

    console.error("Unexpected error in wallet info controller:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
