import express, { Request, Response } from "express";
import axios from "axios";

const router = express.Router();

// GET /api/blockchair/stats
router.get("/", async (req: Request, res: Response) => {
  try {
    const resp = await axios.get("https://api.blockchair.com/bitcoin/stats");
    return res.json(resp.data);
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e.message || "Failed to fetch Blockchair Bitcoin stats" });
  }
});

export default router;
