import crypto from "node:crypto";
import type { Order } from "../types";
import { ORDERBOOK } from "./orderbook";
import { FILLS } from "./fills";
import { pushDepthDelta } from "./depth";
import { flipBalance } from "./settlement";
import { wsClient } from "../config/redis";

export function matchLimitBuy(
  incoming: Order,
  userId: string,
  price: number,
  qty: number,
  symbol: string,
  status: string | undefined,
  remaining: number,
): number {
  let rem = remaining;
  const book = ORDERBOOK[symbol];
  if (!book) return rem;

  const asks = book.asks;
  const askPrices = Object.keys(asks)
    .map(Number)
    .sort((a, b) => a - b);

  for (const askPrice of askPrices) {
    if (askPrice > price) {
      break;
    }
    const ordersAtPrice = asks[askPrice];
    if (!ordersAtPrice) continue;

    for (const sellOrders of ordersAtPrice) {
      if (sellOrders.userId === userId) {
        continue;
      }
      if (sellOrders.qty === 0) continue;
      let matchedQty = 0;
      if (sellOrders.qty <= rem) {
        matchedQty = sellOrders.qty;
        rem -= matchedQty;
        sellOrders.qty = 0;
        sellOrders.status = "FILLED";
      } else {
        matchedQty = rem;
        sellOrders.qty -= rem;
        rem = 0;
        sellOrders.status = "PARTIAL";
      }

      const qtyAtAskPrice = ordersAtPrice.reduce(
        (acc, curr) => acc + curr.qty,
        0,
      );
      pushDepthDelta(symbol, "asks", askPrice, qtyAtAskPrice);

      flipBalance(userId, sellOrders.userId, matchedQty, askPrice, symbol);
      console.log("BUY LIMIT MATCH FOUND");

      console.log({
        buyerId: userId,
        sellerId: sellOrders.userId,
        matchedQty,
        executionPrice: askPrice,
        status,
        remainingBeforeTrade: rem,
      });

      const fill = {
        id: crypto.randomUUID(),
        buyOrderId: incoming.id,
        sellOrderId: sellOrders.id,
        symbol,
        price: askPrice,
        qty: matchedQty,
      };

      FILLS.push(fill);
      wsClient.lPush(
        "ws-queue",
        JSON.stringify({
          stream: `trade.${symbol}`,
          value: {
            id: fill.id,
            symbol: fill.symbol,
            price: fill.price,
            qty: matchedQty,
          },
        }),
      );

      console.log("FILL CREATED");
      console.log(FILLS[FILLS.length - 1]);
      incoming.filledqty += matchedQty;

      if (rem === 0) {
        break;
      }
    }
    if (rem === 0) {
      return rem;
    }
  }
  return rem;
}

export function matchLimitSell(
  incoming: Order,
  userId: string,
  price: number,
  qty: number,
  symbol: string,
  status: string | undefined,
  remaining: number,
): number {
  let rem = remaining;
  const book = ORDERBOOK[symbol];
  if (!book) return rem;

  const buys = book.bids;
  const buyprices = Object.keys(buys)
    .map(Number)
    .sort((a, b) => b - a);

  for (const buyprice of buyprices) {
    if (buyprice < price) {
      break;
    }
    const ordersAtPrice = buys[buyprice];
    if (!ordersAtPrice) continue;

    for (const buyorder of ordersAtPrice) {
      if (buyorder.userId === userId) {
        continue;
      }
      if (buyorder.qty === 0) continue;
      let matchedQty = 0;
      if (buyorder.qty >= rem) {
        matchedQty = rem;
        buyorder.qty -= rem;
        buyorder.status = buyorder.qty === 0 ? "FILLED" : "PARTIAL";
        rem = 0;
      } else {
        matchedQty = buyorder.qty;
        rem -= buyorder.qty;
        buyorder.status = "FILLED";
        buyorder.qty = 0;
      }

      const qtyAtBuyPrice = ordersAtPrice.reduce(
        (acc, curr) => acc + curr.qty,
        0,
      );
      pushDepthDelta(symbol, "bids", buyprice, qtyAtBuyPrice);

      console.log("SELL LIMIT MATCH FOUND");

      console.log({
        buyerId: buyorder.userId,
        sellerId: userId,
        matchedQty,
        status,
        executionPrice: buyprice,
        remainingBeforeTrade: rem,
      });
      flipBalance(buyorder.userId, userId, matchedQty, buyprice, symbol);

      const fill = {
        id: crypto.randomUUID(),
        buyOrderId: buyorder.id,
        sellOrderId: incoming.id,
        symbol,
        price: buyprice,
        qty: matchedQty,
      };
      FILLS.push(fill);

      wsClient.lPush(
        "ws-queue",
        JSON.stringify({
          stream: `trade.${symbol}`,
          value: {
            id: fill.id,
            symbol: fill.symbol,
            price: fill.price,
            qty: fill.qty,
          },
        }),
      );
      console.log("FILL CREATED");
      console.log(FILLS[FILLS.length - 1]);
      incoming.filledqty += matchedQty;
      if (rem === 0) {
        return rem;
      }
    }
  }
  return rem;
}
