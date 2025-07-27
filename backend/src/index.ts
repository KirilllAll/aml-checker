import express from "express";
import { walletValidateController } from "./controllers/wallet-validate.controller";
import { walletInfoController } from "./controllers/wallet-info.controller";

const app = express();
app.use(express.json());

// API routes
app.post("/api/wallet/validate", walletValidateController);
app.post("/api/wallet/info", walletInfoController);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
