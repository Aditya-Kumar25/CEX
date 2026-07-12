import crypto from "node:crypto";
import type { Order } from "../types";
import { ORDERBOOK } from "./orderbook";
import { FILLS } from "./fills";
import { pushDepthDelta } from "./depth";
import { flipBalance } from "./settlement";
import { wsClient } from "../config/redis";

export function matchMarketBuy(
  incoming: Order,
  userId: string,
  symbol: string,
  remaining: number,
): number {
  let rem = remaining;
  const book = ORDERBOOK[symbol];
  if (!book) return rem;

  const ask = book.asks;
  const askOrders = Object.keys(ask)
    .map(Number)
    .sort((a, b) => a - b);

  for (const askPrice of askOrders) {
    const ordersAtPrice = ask[askPrice];
    if (!ordersAtPrice) continue;

    for (const askOrder of ordersAtPrice) {
      if (askOrder.userId === userId) {
        continue;
      }
      if (askOrder.qty === 0) continue;
      let matchedQty = 0;
      if (askOrder.qty <= rem) {
        matchedQty = askOrder.qty;
        rem -= matchedQty;
        askOrder.qty = 0;
        askOrder.status = "FILLED";
      } else {
        matchedQty = rem;
        askOrder.qty -= rem;
        rem = 0;
        askOrder.status = "PARTIAL";
      }

      const qtyAtAskPrice = ordersAtPrice.reduce(
        (acc, curr) => acc + curr.qty,
        0,
      );
      pushDepthDelta(symbol, "asks", askPrice, qtyAtAskPrice);

      flipBalance(userId, askOrder.userId, matchedQty, askPrice, symbol, askPrice);
      console.log("MARKET BUY MATCH FOUND");

      console.log({
        buyerId: userId,
        sellerId: askOrder.userId,
        matchedQty,
        executionPrice: askPrice,
        remainingBeforeTrade: rem,
      });

      const fill = {
        id: crypto.randomUUID(),
        buyOrderId: incoming.id,
        sellOrderId: askOrder.id,
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
            symbol,
            price: fill.price,
            qty: fill.qty,
          },
        }),
      );
      incoming.filledqty += matchedQty;

      if (rem === 0) {
        break;
      }
    }
    if (rem === 0) {
      break;
    }
  }
  return rem;
}

export function matchMarketSell(
  incoming: Order,
  userId: string,
  symbol: string,
  status: string | undefined,
  remaining: number,
): number {
  let rem = remaining;
  const book = ORDERBOOK[symbol];
  if (!book) return rem;

  const buy = book.bids;
  const buyOrders = Object.keys(buy)
    .map(Number)
    .sort((a, b) => b - a);

  for (const buyPrice of buyOrders) {
    const ordersAtPrice = buy[buyPrice];
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
        buyorder.qty = 0;
        buyorder.status = "FILLED";
      }

      const qtyAtBuyPrice = ordersAtPrice.reduce(
        (acc, curr) => acc + curr.qty,
        0,
      );
      pushDepthDelta(symbol, "bids", buyPrice, qtyAtBuyPrice);

      console.log("MARKET SELL MATCH FOUND");

      console.log({
        buyerId: buyorder.userId,
        sellerId: userId,
        matchedQty,
        status,
        executionPrice: buyPrice,
        remainingBeforeTrade: rem,
      });
      flipBalance(buyorder.userId, userId, matchedQty, buyPrice, symbol, Number(buyorder.price));

      const fill = {
        id: crypto.randomUUID(),
        buyOrderId: buyorder.id,
        sellOrderId: incoming.id,
        symbol,
        qty: matchedQty,
        price: buyPrice,
      };

      FILLS.push(fill);

      wsClient.lPush(
        "ws-queue",
        JSON.stringify({
          stream: `trade.${symbol}`,
          value: {
            id: fill.id,
            symbol,
            price: fill.price,
            qty: fill.qty,
          },
        }),
      );

      incoming.filledqty += matchedQty;
      if (rem === 0) {
        return rem;
      }
    }
  }
  return rem;
}

export function estimateMarketBuyCost(symbol: string, qty: number): number {
  const book = ORDERBOOK[symbol];
  if (!book) return -1;
  const asks = book.asks;
  const askPrices = Object.keys(asks)
    .map(Number)
    .sort((a, b) => a - b);

  let remaining = qty;
  let totalCost = 0;

  for (const askPrice of askPrices) {
    const ordersAtPrice = asks[askPrice];
    if (!ordersAtPrice) continue;

    for (const order of ordersAtPrice) {
      if (order.qty === 0) continue;
      const matched = Math.min(order.qty, remaining);
      totalCost += matched * askPrice;
      remaining -= matched;
      if (remaining === 0) break;
    }
    if (remaining === 0) break;
  }

  if (remaining > 0) return -1; // not enough liquidity
  return totalCost;
}
