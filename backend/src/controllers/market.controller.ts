import type { Request, Response } from "express";
import crypto from "node:crypto";
import { fetchOrderbook, fetchFills, fetchStocks } from "../services/market.service";

export async function getOrderbook(req: Request, res: Response): Promise<any> {
  const { symbol } = req.params;
  const identifier = crypto.randomUUID();

  const returnedData: any = await fetchOrderbook(symbol as string, identifier);

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  return res.json({
    asks: returnedData.asks,
    bids: returnedData.bids,
    offset: returnedData.offset,
  });
}

export async function getFills(req: Request, res: Response): Promise<any> {
  const { symbol } = req.params;
  const identifier = crypto.randomUUID();

  const returnedData: any = await fetchFills(symbol as string, identifier);

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  return res.json({ fills: returnedData.fills });
}

export async function getStocks(req: Request, res: Response): Promise<any> {
  const identifier = crypto.randomUUID();

  const returnedData: any = await fetchStocks(identifier);

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  return res.json(returnedData.stocks);
}
