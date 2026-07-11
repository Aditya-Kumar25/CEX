import { Router } from "express";
import { placeOrder, cancelOrder, getOrders } from "../controllers/order.controller";
import authcheck from "../middleware/auth.middleware";

const router = Router();

router.post("/order", authcheck, placeOrder);
router.delete("/order/:orderId", authcheck, cancelOrder);
router.get("/getorder", authcheck, getOrders);

export default router;
