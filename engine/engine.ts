import crypto from "node:crypto";
import express from "express";
import type { Request, Response } from "express";
import { client, publisherClient } from "./config/redis";
import type { Order } from "./types";
import { STOCKS, ORDERS, ORDERBOOK } from "./core/orderbook";
import { FILLS } from "./core/fills";
import { BALANCES, ensureUserBalance } from "./core/balance";
import { Depth_Update, pushDepthDelta } from "./core/depth";
import { FilledOrders } from "./core/matchingEngine";
import { estimateMarketBuyCost } from "./core/marketOrders";
import { cancelOrder } from "./core/cancellation";
import { loadSnapshot } from "./persistence/loadsnapshot";
import { saveSnapshot } from "./persistence/savesnapshot";

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/healthz", (req: Request, res: Response) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log(`[Engine Health Server] Listening on port ${PORT}`);
});

await loadSnapshot();

setInterval(() => {
  saveSnapshot().catch((err) => {
    console.error("[Snapshot] Background save failed:", err);
  });
}, 15000);

while (1) {
  const response = await client.brPop("incoming-order", 1);
  if (!response) {
    continue;
  }
  const parsed = JSON.parse(response.element);
  console.log(`[Engine] Pop received from 'incoming-order'. req_type: ${parsed.req_type}, identifier: ${parsed.identifier}`);

  if (parsed.req_type === "order") {
    const type = parsed.type;
    const price = Number(parsed.price);
    const qty = Number(parsed.qty);
    const { side, status, symbol, userId, identifier } = parsed;

    ensureUserBalance(userId);
    const requiredAmt = price * qty;

    const userBalance = BALANCES[userId];
    if (!userBalance) continue;

    let estimatedCost = 0;

    if (side === "BUY" && type === "LIMIT") {
      if (userBalance.INR.available < requiredAmt) {
        await publisherClient.lPush(
          "response-queue",
          JSON.stringify({ identifier, success: false }),
        );
        continue;
      }
      userBalance.INR.available -= requiredAmt;
      userBalance.INR.locked += requiredAmt;
    } else if (side === "BUY" && type === "MARKET") {
      estimatedCost = estimateMarketBuyCost(symbol, qty);
      if (estimatedCost === -1) {
        await publisherClient.lPush(
          "response-queue",
          JSON.stringify({ identifier, success: false }),
        );
        continue;
      }
      if (userBalance.INR.available < estimatedCost) {
        await publisherClient.lPush(
          "response-queue",
          JSON.stringify({ identifier, success: false }),
        );
        continue;
      }
      userBalance.INR.available -= estimatedCost;
      userBalance.INR.locked += estimatedCost;
    } else if (side === "SELL") {
      let userSymbolBalance = userBalance[symbol];
      if (!userSymbolBalance) {
        userSymbolBalance = { available: 0, locked: 0 };
        userBalance[symbol] = userSymbolBalance;
      }

      if (userSymbolBalance.available < qty) {
        await publisherClient.lPush(
          "response-queue",
          JSON.stringify({
            identifier,
            success: false,
          }),
        );
        continue;
      }

      userSymbolBalance.available -= qty;
      userSymbolBalance.locked += qty;
    }

    const incoming: Order = {
      id: crypto.randomUUID(),
      userId,
      symbol,
      side,
      type,
      qty,
      status: "OPEN",
      price,
      filledqty: 0,
    };

    const remainingQty = FilledOrders(
      incoming,
      userId,
      price,
      side,
      qty,
      type,
      symbol,
      status,
    );

    if (type === "MARKET") {
      if (remainingQty === 0) {
        incoming.status = "FILLED";
      } else {
        incoming.status = "CANCELLED";
        if (side === "SELL") {
          const userSymbolBalance = userBalance[symbol];
          if (userSymbolBalance) {
            userSymbolBalance.available += remainingQty;
            userSymbolBalance.locked -= remainingQty;
          }
        } else if (side === "BUY") {
          const fillsForOrder = FILLS.filter((f) => f.buyOrderId === incoming.id);
          const matchedCost = fillsForOrder.reduce((sum, f) => sum + f.qty * f.price, 0);
          const leftoverINR = estimatedCost - matchedCost;
          if (leftoverINR > 0) {
            userBalance.INR.available += leftoverINR;
            userBalance.INR.locked -= leftoverINR;
          }
        }
      }
    } else { // LIMIT
      if (remainingQty === 0) {
        incoming.status = "FILLED";
      } else if (remainingQty < qty) {
        incoming.status = "PARTIAL";
      } else {
        incoming.status = "OPEN";
      }
    }

    ORDERS.push(incoming);

    if (remainingQty > 0 && type === "LIMIT") {
      incoming.qty = remainingQty;

      const symbolBook = ORDERBOOK[symbol];
      if (symbolBook) {
        if (side === "BUY") {
          let bidsAtPrice = symbolBook.bids[price];
          if (!bidsAtPrice) {
            bidsAtPrice = [];
            symbolBook.bids[price] = bidsAtPrice;
          }

          bidsAtPrice.push(incoming);

          const qtyAtPrice = bidsAtPrice.reduce(
            (acc, curr) => acc + curr.qty,
            0,
          );

          pushDepthDelta(symbol, "bids", price, qtyAtPrice);
        } else {
          let asksAtPrice = symbolBook.asks[price];
          if (!asksAtPrice) {
            asksAtPrice = [];
            symbolBook.asks[price] = asksAtPrice;
          }

          asksAtPrice.push(incoming);

          const qtyAtPrice = asksAtPrice.reduce(
            (acc, curr) => acc + curr.qty,
            0,
          );

          pushDepthDelta(symbol, "asks", price, qtyAtPrice);
        }
      }
    }

    const filledQty = qty - remainingQty;
    console.log(filledQty);
    console.log(identifier);

    await publisherClient.lPush(
      "response-queue",
      JSON.stringify({ filledQty, identifier, success: true }),
    );
  } else if (parsed.req_type === "delete-order") {
    const { orderId, currentUser, identifier } = parsed;
    await cancelOrder(orderId, currentUser, identifier);
  } else if (parsed.req_type === "get orders") {
    console.log(ORDERS);
    const { userId, identifier } = parsed;
    const orders = ORDERS.filter((o) => o.userId === userId);
    await publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: true,
        orders,
      }),
    );
  } else if (parsed.req_type === "get-orderbook") {
    const { symbol, identifier } = parsed;

    const symbolBook = ORDERBOOK[symbol];
    if (!symbolBook) {
      await publisherClient.lPush(
        "response-queue",
        JSON.stringify({
          identifier,
          success: false,
          statusCode: 404,
          msg: "Unknown symbol",
        }),
      );
      continue;
    }

    const asks = Object.entries(symbolBook.asks).map(
      ([priceStr, orders]) => {
        const price = Number(priceStr);
        const qtySum = orders ? orders.reduce((acc, curr) => acc + curr.qty, 0) : 0;
        return { price, qty: qtySum };
      }
    );

    const bids = Object.entries(symbolBook.bids).map(
      ([priceStr, orders]) => {
        const price = Number(priceStr);
        const qtySum = orders ? orders.reduce((acc, curr) => acc + curr.qty, 0) : 0;
        return { price, qty: qtySum };
      }
    );

    await publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: true,
        asks,
        bids,
        offset: Depth_Update[symbol],
      }),
    );
  } else if (parsed.req_type === "get-fills") {
    const { symbol, identifier } = parsed;

    const fills = FILLS.filter((f) => f.symbol === symbol);

    await publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: true,
        fills,
      }),
    );
  } else if (parsed.req_type === "get-stocks") {
    const { identifier } = parsed;
    console.log(`[Engine] Entering 'get-stocks' handler, identifier: ${identifier}`);

    console.log(`[Engine] Pushing stocks response to 'response-queue', identifier: ${identifier}`);
    await publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: true,
        stocks: STOCKS,
      }),
    );
  } else if (parsed.req_type === "get-balance") {
    console.log("entered the queue");
    const { currentUser, identifier } = parsed;

    ensureUserBalance(currentUser);
    const balance = BALANCES[currentUser];

    await publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: true,
        balance,
      }),
    );
  }
}
