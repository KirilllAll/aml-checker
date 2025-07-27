import { Request, Response } from 'express';
import { NetworkDetector } from '../services/network-detector.service';

export const walletValidateController = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        error: 'Address is required',
      });
    }

    const detector = new NetworkDetector();
    const result = await detector.detectAndValidate(address);

    return res.json(result);
  } catch (error) {
    console.error('Error in wallet validation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to validate address',
    });
  }
};
