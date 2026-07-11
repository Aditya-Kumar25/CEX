import type { Request, Response } from "express";
import crypto from "node:crypto";
import { fetchBalances } from "../services/balance.service";

export async function getBalances(req: Request, res: Response): Promise<any> {
  const currentUser = req.userId!;
  const req_type = "get-balance";
  const identifier = crypto.randomUUID();

  // Keep the log statement exactly identical to original:
  // "Sending data to queue , babes"
  console.log("Sending data to queue , babes");
  const returnedData: any = await fetchBalances(currentUser, identifier);
  console.log(returnedData);

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  return res.json({ balance: returnedData.balance });
}
