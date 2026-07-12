import { ORDERS, ORDERBOOK } from "./orderbook";
import { BALANCES } from "./balance";
import { pushDepthDelta } from "./depth";
import { publisherClient } from "../config/redis";

export async function cancelOrder(
  orderId: string,
  currentUser: string,
  identifier: string,
) {
  const isOrder = ORDERS.find((o) => o.id === orderId);

  if (!isOrder) {
    await publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: false,
        statusCode: 404,
        msg: "No order found against it bhai!! Sahab",
      }),
    );
    return;
  }

  if (isOrder.userId !== currentUser) {
    await publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: false,
        statusCode: 403,
        msg: "Forbidden",
      }),
    );
    return;
  }

  if (isOrder.status === "FILLED" || isOrder.status === "CANCELLED") {
    await publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: false,
        statusCode: 400,
        msg: "Order cannot be cancelled",
      }),
    );
    return;
  }

  const remainingQty = isOrder.qty;
  const totalAmt = remainingQty * isOrder.price;

  const userBalance = BALANCES[currentUser];
  if (!userBalance) {
    return;
  }

  const symbolBook = ORDERBOOK[isOrder.symbol];

  if (isOrder.side === "BUY") {
    userBalance.INR.available += totalAmt;
    userBalance.INR.locked -= totalAmt;

    if (symbolBook) {
      const bidsAtPrice = symbolBook.bids[isOrder.price];
      if (bidsAtPrice) {
        symbolBook.bids[isOrder.price] = bidsAtPrice.filter(
          (o) => o.id !== orderId,
        );

        const remainingAtPrice = symbolBook.bids[isOrder.price];
        const qtyAtPrice = remainingAtPrice
          ? remainingAtPrice.reduce((acc, curr) => acc + curr.qty, 0)
          : 0;
        pushDepthDelta(isOrder.symbol, "bids", isOrder.price, qtyAtPrice);

        const currentBidsAtPrice = symbolBook.bids[isOrder.price];
        if (currentBidsAtPrice && currentBidsAtPrice.length === 0) {
          delete symbolBook.bids[isOrder.price];
        }
      }
    }
  } else {
    let userSymbolBalance = userBalance[isOrder.symbol];
    if (!userSymbolBalance) {
      userSymbolBalance = { available: 0, locked: 0 };
      userBalance[isOrder.symbol] = userSymbolBalance;
    }
    userSymbolBalance.available += remainingQty;
    userSymbolBalance.locked -= remainingQty;

    if (symbolBook) {
      const asksAtPrice = symbolBook.asks[isOrder.price];
      if (asksAtPrice) {
        symbolBook.asks[isOrder.price] = asksAtPrice.filter(
          (o) => o.id !== orderId,
        );

        const remainingAtPrice = symbolBook.asks[isOrder.price];
        const qtyAtPrice = remainingAtPrice
          ? remainingAtPrice.reduce((acc, curr) => acc + curr.qty, 0)
          : 0;
        pushDepthDelta(isOrder.symbol, "asks", isOrder.price, qtyAtPrice);

        const currentAsksAtPrice = symbolBook.asks[isOrder.price];
        if (currentAsksAtPrice && currentAsksAtPrice.length === 0) {
          delete symbolBook.asks[isOrder.price];
        }
      }
    }
  }

  isOrder.status = "CANCELLED";

  await publisherClient.lPush(
    "response-queue",
    JSON.stringify({
      identifier,
      success: true,
      msg: "Order Cancelled",
    }),
  );
}
