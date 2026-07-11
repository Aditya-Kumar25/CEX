import type { Request, Response } from "express";
import crypto from "node:crypto";
import { createOrder, deleteOrder, fetchOrders } from "../services/order.service";
import { VALID_SYMBOLS } from "../lib/constants";

export async function placeOrder(req: Request, res: Response): Promise<any> {
  const userId = req.userId!;
  console.log(userId);
  const { type, price, qty, symbol, side } = req.body;

  if (side !== "BUY" && side !== "SELL") {
    return res.status(400).json({
      msg: "Invalid Side Selection",
    });
  }

  if (type !== "LIMIT" && type !== "MARKET") {
    return res.status(400).json({
      msg: "Invalid Order Type",
    });
  }

  if (type === "LIMIT" && (typeof price !== "number" || price <= 0)) {
    return res.status(400).json({
      msg: "Invalid price for LIMIT order",
    });
  }

  if (typeof qty !== "number" || qty <= 0) {
    return res.status(400).json({
      msg: "Invalid quantity",
    });
  }

  if (!VALID_SYMBOLS.includes(symbol)) {
    return res.status(400).json({
      msg: "Invalid symbol",
    });
  }
  const identifier = crypto.randomUUID();

  console.log("ORDER RECEIVED:", identifier);
  console.log("WAITING FOR ENGINE:", identifier);
  const returnedData: any = await createOrder(type, price, qty, side, symbol, userId, identifier);
  console.log("RESPONSE FROM ENGINE:", returnedData);
  if (!returnedData.success) {
    return res.status(402).json({
      msg: "Insufficient availability of amount/qty or no stock avl for this symbol",
    });
  }
  return res.json({ msg: "Order Placed", filledQty: returnedData.filledQty });
}

export async function cancelOrder(req: Request, res: Response): Promise<any> {
  const { orderId } = req.params;
  const currentUser = req.userId!;
  const identifier = crypto.randomUUID();

  const returnedData: any = await deleteOrder(orderId as string, currentUser, identifier);

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  return res.json({ msg: "Order Cancelled" });
}

export async function getOrders(req: Request, res: Response): Promise<any> {
  const userId = req.userId!;
  const identifier = crypto.randomUUID();

  const returnedData: any = await fetchOrders(userId, identifier);
  console.log("GET ORDERS RESPONSE", returnedData);
  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }
  return res.json(returnedData.orders);
}
