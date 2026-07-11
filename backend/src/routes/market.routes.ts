import { Router } from "express";
import { getOrderbook, getFills, getStocks } from "../controllers/market.controller";

const router = Router();

router.get("/orderbook/:symbol", getOrderbook);
router.get("/fills/:symbol", getFills);
router.get("/stocks", getStocks);

export default router;
