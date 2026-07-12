import crypto from "node:crypto";
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

  if (parsed.req_type === "order") {
    const type = parsed.type;
    const price = Number(parsed.price);
    const qty = Number(parsed.qty);
    const { side, status, symbol, userId, identifier } = parsed;

    ensureUserBalance(userId);
    const requiredAmt = price * qty;

    const userBalance = BALANCES[userId];
    if (!userBalance) continue;

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
      const estimatedCost = estimateMarketBuyCost(symbol, qty);
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

    if (remainingQty === 0) {
      incoming.status = "FILLED";
    } else if (remainingQty < qty) {
      incoming.status = "PARTIAL";
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
