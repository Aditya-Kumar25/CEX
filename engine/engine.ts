import { createClient } from "redis";

const client = await createClient({})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

const publisherClient = await createClient({})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

const wsClient = await createClient({})
  .on("error", (e) => console.log("Redis Client Error", e))
  .connect();

type side = "BUY" | "SELL";
type OrderType = "LIMIT" | "MARKET";
type status = "FILLED" | "PARTIAL" | "OPEN" | "CLOSED" | "CANCELLED";

interface Stock {
  id: number;
  title: string;
  symbol: string;
}

interface Order {
  id: string;
  userId: string;
  symbol: string;
  side: side;
  price: number;
  qty: number;
  type: OrderType;
  status: status;
  filledqty: number;
}

interface Fill {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  symbol: string;
  price: number;
  qty: number;
}

interface AssetBalance {
  available: number;
  locked: number;
}

interface UserBalance {
  INR: AssetBalance;
  [asset: string]: AssetBalance;
}

interface OrderBookSide {
  [price: string]: Order[];
}

interface SymbolOrderBook {
  bids: OrderBookSide;
  asks: OrderBookSide;
}

const STOCKS: Stock[] = [
  { id: 1, title: "TESLA", symbol: "TESLA" },
  { id: 2, title: "SpaceX", symbol: "SPACEX" },
  { id: 3, title: "BTC-USD", symbol: "BTC" },
];

const ORDERS: Order[] = [];
const FILLS: Fill[] = [];
const BALANCES: Record<string, UserBalance> = {};

const ORDERBOOK: Record<string, SymbolOrderBook> = {
  TESLA: { bids: {}, asks: {} },
  SPACEX: { bids: {}, asks: {} },
  BTC: { bids: {}, asks: {} },
};

const Depth_Update: Record<string, number> = {
  TESLA: 0,
  SPACEX: 0,
  BTC: 0,
};

function ensureUserBalance(userId: string) {
  if (!BALANCES[userId]) {
    BALANCES[userId] = {
      INR: { available: 1000000, locked: 0 },

      BTC: {
        available: 20,
        locked: 0,
      },
      TESLA: {
        available: 50,
        locked: 0,
      },
      SPACEX: {
        available: 50,
        locked: 0,
      },
    };
  }
}

/**
 * Pushes a single depth delta for one side of the book, at one price level.
 *
 * This is intentionally the ONLY place that builds the ws-queue depth
 * message. Every mutation site below (both inside FilledOrders and outside
 * it, when a resting remainder gets added to the book) calls this instead
 * of hand-rolling the JSON.stringify each time. That keeps the "which side
 * am I pushing" logic in one spot instead of duplicated 6 times.
 *
 * side: "bids" or "asks" - which side of the book changed.
 * price: the price level that changed.
 * qtyAtPrice: the new total resting qty at that price level (0 means the
 *             level is now empty / should be treated as removed on the
 *             client).
 */
function pushDepthDelta(
  symbol: string,
  side: "bids" | "asks",
  price: number,
  qtyAtPrice: number,
) {
  Depth_Update[symbol]++;

  wsClient.lPush(
    "ws-queue",
    JSON.stringify({
      stream: `depth.${symbol}`,
      value: {
        offset: Depth_Update[symbol],
        bids: side === "bids" ? [[price, qtyAtPrice]] : [],
        asks: side === "asks" ? [[price, qtyAtPrice]] : [],
      },
    }),
  );
}

function FilledOrders(
  incoming: Order,
  userId: string,
  price: number,
  side: side,
  qty: number,
  type: OrderType,
  symbol: string,
  status: status,
) {
  let remaining = qty;

  console.log({
    side,
    type,
    symbol,
    price,
    qty,
    status,
  });

  console.log("ORDERBOOK SNAPSHOT");

  console.dir(ORDERBOOK[symbol], {
    depth: null,
  });

  if (type === "LIMIT" && side === "BUY") {
    // Incoming BUY consumes resting ASKS. Every ask price level we touch
    // here has its qty reduced, so each iteration needs an "asks" delta.
    const asks = ORDERBOOK[symbol].asks;
    const askPrices = Object.keys(asks)
      .map(Number)
      .sort((a, b) => a - b);
    for (const askPrice of askPrices) {
      if (askPrice > price) {
        break;
      }
      const ordersAtPrice = asks[askPrice];
      for (const sellOrders of ordersAtPrice) {
        // Orders that were fully filled by an earlier iteration are left
        // in the array with qty 0 rather than spliced out (cheaper, but
        // means later matches must skip them explicitly or they'd
        // silently produce matchedQty = 0 fills).
        if (sellOrders.userId === userId) {
          continue;
        }
        if (sellOrders.qty === 0) continue;
        let matchedQty = 0;
        if (sellOrders.qty <= remaining) {
          matchedQty = sellOrders.qty;
          remaining -= matchedQty;
          sellOrders.qty = 0;
          sellOrders.status = "FILLED";
        } else {
          matchedQty = remaining;
          sellOrders.qty -= remaining;
          remaining = 0;
          sellOrders.status = "PARTIAL";
        }

        // ASK LEVEL JUST CHANGED (a resting sell order's qty was reduced
        // or zeroed out). Recompute the total resting qty at this price
        // and push that as the new depth for askPrice, on the asks side.
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
          remainingBeforeTrade: remaining,
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

        if (remaining === 0) {
          break;
        }
      }
      if (remaining === 0) {
        return remaining;
      }
    }
  } else if (type === "LIMIT" && side === "SELL") {
    // Incoming SELL consumes resting BIDS. Every bid price level we touch
    // here has its qty reduced, so each iteration needs a "bids" delta.
    const buys = ORDERBOOK[symbol].bids;
    const buyprices = Object.keys(buys)
      .map(Number)
      .sort((a, b) => b - a);
    for (const buyprice of buyprices) {
      if (buyprice < price) {
        break;
      }
      const ordersAtPrice = buys[buyprice];
      for (const buyorder of ordersAtPrice) {
        if (buyorder.userId === userId) {
          continue;
        }
        if (buyorder.qty === 0) continue;
        let matchedQty = 0;
        if (buyorder.qty >= remaining) {
          matchedQty = remaining;
          buyorder.qty -= remaining;
          buyorder.status = buyorder.qty === 0 ? "FILLED" : "PARTIAL";
          remaining = 0;
        } else {
          matchedQty = buyorder.qty;
          remaining -= buyorder.qty;
          buyorder.status = "FILLED";
          buyorder.qty = 0;
        }

        // BID LEVEL JUST CHANGED. Same idea as above, mirrored to the
        // bids side, keyed on buyprice instead of askPrice.
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
          remainingBeforeTrade: remaining,
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
        if (remaining === 0) {
          return remaining;
        }
      }
    }
  } else if (type === "MARKET" && side === "BUY") {
    // Same as LIMIT BUY matching-wise: consumes asks, so push asks deltas.
    // MARKET orders never rest, so this loop is the ONLY place a depth
    // push is needed for this branch - there's no "remainder added to
    // book" step afterwards for MARKET orders.
    const ask = ORDERBOOK[symbol].asks;
    const askOrders = Object.keys(ask)
      .map(Number)
      .sort((a, b) => a - b);
    for (const askPrice of askOrders) {
      const ordersAtPrice = ask[askPrice];
      for (const askOrder of ordersAtPrice) {
        if (askOrder.userId === userId) {
          continue;
        }
        if (askOrder.qty === 0) continue;
        let matchedQty = 0;
        if (askOrder.qty <= remaining) {
          matchedQty = askOrder.qty;
          remaining -= matchedQty;
          askOrder.qty = 0;
          askOrder.status = "FILLED";
        } else {
          matchedQty = remaining;
          askOrder.qty -= remaining;
          remaining = 0;
          askOrder.status = "PARTIAL";
        }

        // ASK LEVEL JUST CHANGED.
        const qtyAtAskPrice = ordersAtPrice.reduce(
          (acc, curr) => acc + curr.qty,
          0,
        );
        pushDepthDelta(symbol, "asks", askPrice, qtyAtAskPrice);

        flipBalance(userId, askOrder.userId, matchedQty, askPrice, symbol);
        console.log("MARKET BUY MATCH FOUND");

        console.log({
          buyerId: userId,
          sellerId: askOrder.userId,
          matchedQty,
          executionPrice: askPrice,
          remainingBeforeTrade: remaining,
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

        if (remaining === 0) {
          break;
        }
      }
      if (remaining === 0) {
        break;
      }
    }
  } else {
    // MARKET SELL - consumes bids, so push bids deltas. Same "no
    // remainder ever rests" reasoning as MARKET BUY above.
    const buy = ORDERBOOK[symbol].bids;
    const buyOrders = Object.keys(buy)
      .map(Number)
      .sort((a, b) => b - a);
    for (const buyPrice of buyOrders) {
      const ordersAtPrice = buy[buyPrice];
      for (const buyorder of ordersAtPrice) {
        if (buyorder.userId === userId) {
          continue;
        }
        if (buyorder.qty === 0) continue;
        let matchedQty = 0;
        if (buyorder.qty >= remaining) {
          matchedQty = remaining;
          buyorder.qty -= remaining;
          buyorder.status = buyorder.qty === 0 ? "FILLED" : "PARTIAL";
          remaining = 0;
        } else {
          matchedQty = buyorder.qty;
          remaining -= buyorder.qty;
          buyorder.qty = 0;
          buyorder.status = "FILLED";
        }

        // BID LEVEL JUST CHANGED.
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
          remainingBeforeTrade: remaining,
        });
        flipBalance(buyorder.userId, userId, matchedQty, buyPrice, symbol);

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
        if (remaining === 0) {
          return remaining;
        }
      }
    }
  }
  return remaining;
}

function flipBalance(
  buyerId: string,
  sellerId: string,
  qty: number,
  price: number,
  symbol: string,
) {
  const buyerBalance = BALANCES[buyerId];
  const sellerBalance = BALANCES[sellerId];

  const tradeAmount = qty * price;

  console.log("====== SETTLEMENT ======");

  console.log({
    buyerId,
    sellerId,
    qty,
    price,
    symbol,
    tradeAmount,
  });

  if (!buyerBalance[symbol]) {
    buyerBalance[symbol] = {
      available: 0,
      locked: 0,
    };
  }

  if (!sellerBalance[symbol]) {
    sellerBalance[symbol] = {
      available: 0,
      locked: 0,
    };
  }

  buyerBalance.INR.locked -= tradeAmount;
  buyerBalance[symbol].available += qty;

  sellerBalance[symbol].locked -= qty;
  sellerBalance.INR.available += tradeAmount;

  console.log("BUYER AFTER TRADE");

  console.dir(buyerBalance, {
    depth: null,
  });

  console.log("SELLER AFTER TRADE");

  console.dir(sellerBalance, {
    depth: null,
  });
}

function estimateMarketBuyCost(symbol: string, qty: number): number {
  const asks = ORDERBOOK[symbol].asks;
  const askPrices = Object.keys(asks)
    .map(Number)
    .sort((a, b) => a - b);

  let remaining = qty;
  let totalCost = 0;

  for (const askPrice of askPrices) {
    for (const order of asks[askPrice]) {
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

while (1) {
  const response = await client.brPop("incoming-order", 1);
  if (!response) {
    continue;
  }
  const parsed = JSON.parse(response.element);

  if (parsed.req_type === "order") {
    const { type, price, qty, side, status, symbol, userId, identifier } =
      parsed;

    ensureUserBalance(userId);
    const requiredAmt = price * qty;

    if (side === "BUY" && type === "LIMIT") {
      if (BALANCES[userId].INR.available < requiredAmt) {
        publisherClient.lPush(
          "response-queue",
          JSON.stringify({ identifier, success: false }),
        );
        continue;
      }
      BALANCES[userId].INR.available -= requiredAmt;
      BALANCES[userId].INR.locked += requiredAmt;
    } else if (side === "BUY" && type === "MARKET") {
      const estimatedCost = estimateMarketBuyCost(symbol, qty);
      if (estimatedCost === -1) {
        publisherClient.lPush(
          "response-queue",
          JSON.stringify({ identifier, success: false }),
        );
        continue;
      }
      if (BALANCES[userId].INR.available < estimatedCost) {
        publisherClient.lPush(
          "response-queue",
          JSON.stringify({ identifier, success: false }),
        );
        continue;
      }
      BALANCES[userId].INR.available -= estimatedCost;
      BALANCES[userId].INR.locked += estimatedCost;
    } else if (side === "SELL") {
      if (
        !BALANCES[userId][symbol] ||
        BALANCES[userId][symbol].available < qty
      ) {
        publisherClient.lPush(
          "response-queue",
          JSON.stringify({
            identifier,
            success: false,
          }),
        );
        continue;
      }

      BALANCES[userId][symbol].available -= qty;
      BALANCES[userId][symbol].locked += qty;
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

    // Only a LIMIT order can have leftover qty that rests on the book.
    // MARKET orders either fill fully or the remainder is discarded
    // (no MARKET resting), so no depth push is needed for MARKET here -
    // all of that was already handled inside FilledOrders above.
    ORDERS.push(incoming);

    if (remainingQty > 0 && type === "LIMIT") {
      incoming.qty = remainingQty;

      if (side === "BUY") {
        if (!ORDERBOOK[symbol].bids[price]) {
          ORDERBOOK[symbol].bids[price] = [];
        }

        ORDERBOOK[symbol].bids[price].push(incoming);

        const qtyAtPrice = ORDERBOOK[symbol].bids[price].reduce(
          (acc, curr) => acc + curr.qty,
          0,
        );

        pushDepthDelta(symbol, "bids", price, qtyAtPrice);
      } else {
        if (!ORDERBOOK[symbol].asks[price]) {
          ORDERBOOK[symbol].asks[price] = [];
        }

        ORDERBOOK[symbol].asks[price].push(incoming);

        const qtyAtPrice = ORDERBOOK[symbol].asks[price].reduce(
          (acc, curr) => acc + curr.qty,
          0,
        );

        pushDepthDelta(symbol, "asks", price, qtyAtPrice);
      }
    }

    const filledQty = qty - remainingQty;
    console.log(filledQty);
    console.log(identifier);

    publisherClient.lPush(
      "response-queue",
      JSON.stringify({ filledQty, identifier, success: true }),
    );
  } else if (parsed.req_type === "delete-order") {
    const { orderId, currentUser, identifier } = parsed;

    const isOrder = ORDERS.find((o) => o.id === orderId);

    if (!isOrder) {
      publisherClient.lPush(
        "response-queue",
        JSON.stringify({
          identifier,
          success: false,
          statusCode: 404,
          msg: "No order found against it bhai!! Sahab",
        }),
      );
      continue;
    }

    if (isOrder.userId !== currentUser) {
      publisherClient.lPush(
        "response-queue",
        JSON.stringify({
          identifier,
          success: false,
          statusCode: 403,
          msg: "Forbidden",
        }),
      );
      continue;
    }

    if (isOrder.status === "FILLED" || isOrder.status === "CANCELLED") {
      publisherClient.lPush(
        "response-queue",
        JSON.stringify({
          identifier,
          success: false,
          statusCode: 400,
          msg: "Order cannot be cancelled",
        }),
      );
      continue;
    }

    // isOrder.qty is NOT the original order size once it has rested at
    // least partially - it gets overwritten to the resting remainder
    // right where it's pushed onto the book (see `incoming.qty =
    // remainingQty` above). So it already IS "how much is left to
    // cancel." Subtracting filledqty again here would double-count the
    // fill that already happened before it started resting.
    const remainingQty = isOrder.qty;
    const totalAmt = remainingQty * isOrder.price;

    if (isOrder.side === "BUY") {
      BALANCES[currentUser].INR.available += totalAmt;
      BALANCES[currentUser].INR.locked -= totalAmt;

      const bidsAtPrice = ORDERBOOK[isOrder.symbol]?.bids[isOrder.price];
      if (bidsAtPrice) {
        ORDERBOOK[isOrder.symbol].bids[isOrder.price] = bidsAtPrice.filter(
          (o) => o.id !== orderId,
        );

        // BID LEVEL JUST CHANGED (an order was removed from it). If the
        // level still has resting orders, push the new total qty; if it's
        // now empty, push 0 so the client removes the row instead of
        // showing a stale qty from before cancellation.
        const remainingAtPrice = ORDERBOOK[isOrder.symbol].bids[isOrder.price];
        const qtyAtPrice = remainingAtPrice
          ? remainingAtPrice.reduce((acc, curr) => acc + curr.qty, 0)
          : 0;
        pushDepthDelta(isOrder.symbol, "bids", isOrder.price, qtyAtPrice);

        if (ORDERBOOK[isOrder.symbol].bids[isOrder.price].length === 0) {
          delete ORDERBOOK[isOrder.symbol].bids[isOrder.price];
        }
      }
    } else {
      BALANCES[currentUser][isOrder.symbol].available += remainingQty;
      BALANCES[currentUser][isOrder.symbol].locked -= remainingQty;

      const asksAtPrice = ORDERBOOK[isOrder.symbol]?.asks[isOrder.price];
      if (asksAtPrice) {
        ORDERBOOK[isOrder.symbol].asks[isOrder.price] = asksAtPrice.filter(
          (o) => o.id !== orderId,
        );

        // ASK LEVEL JUST CHANGED - same reasoning as the bids branch
        // above, mirrored to the asks side.
        const remainingAtPrice = ORDERBOOK[isOrder.symbol].asks[isOrder.price];
        const qtyAtPrice = remainingAtPrice
          ? remainingAtPrice.reduce((acc, curr) => acc + curr.qty, 0)
          : 0;
        pushDepthDelta(isOrder.symbol, "asks", isOrder.price, qtyAtPrice);

        if (ORDERBOOK[isOrder.symbol].asks[isOrder.price].length === 0) {
          delete ORDERBOOK[isOrder.symbol].asks[isOrder.price];
        }
      }
    }

    isOrder.status = "CANCELLED";

    publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: true,
        msg: "Order Cancelled",
      }),
    );
  } else if (parsed.req_type === "get orders") {
    console.log(ORDERS);
    const { userId, identifier } = parsed;
    const orders = ORDERS.filter((o) => o.userId === userId);
    publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: true,
        orders,
      }),
    );
  } else if (parsed.req_type === "get-orderbook") {
    const { symbol, identifier } = parsed;

    if (!ORDERBOOK[symbol]) {
      publisherClient.lPush(
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

    const asks = Object.entries(ORDERBOOK[symbol].asks).map(
      ([price, orders]) => ({
        price: Number(price),
        qty: orders.reduce((acc, curr) => acc + curr.qty, 0),
      }),
    );

    const bids = Object.entries(ORDERBOOK[symbol].bids).map(
      ([price, orders]) => ({
        price: Number(price),
        qty: orders.reduce((acc, curr) => acc + curr.qty, 0),
      }),
    );

    // The frontend needs to know which offset this snapshot corresponds
    // to, so it can discard any WS depth messages with offset <= this
    // value and only apply ones that arrived after the snapshot was
    // taken. Without this the client has no way to line up the REST
    // snapshot with the WS delta stream.
    publisherClient.lPush(
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

    publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: true,
        fills,
      }),
    );
  } else if (parsed.req_type === "get-stocks") {
    const { identifier } = parsed;

    publisherClient.lPush(
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

    publisherClient.lPush(
      "response-queue",
      JSON.stringify({
        identifier,
        success: true,
        balance,
      }),
    );
  }
}
