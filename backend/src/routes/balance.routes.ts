import { Router } from "express";
import { getBalances } from "../controllers/balance.controller";
import authcheck from "../middleware/auth.middleware";

const router = Router();

router.get("/balances", authcheck, getBalances);

export default router;
