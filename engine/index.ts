import { createClient } from "redis";

const client = await createClient({})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

const publisherClient = await createClient({})
  .on("error", (err) => console.log("Redis Client Error", err))
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

function ensureUserBalance(userId: string) {
  if (!BALANCES[userId]) {
    BALANCES[userId] = {
      INR: { available: 10000, locked: 0 },

      BTC: {
        available: 20,
        locked: 0,
      },
    };
  }
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
  console.log("====== MATCHING START ======");

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
        FILLS.push({
          id: crypto.randomUUID(),
          buyOrderId: incoming.id,
          sellOrderId: sellOrders.id,
          symbol,
          price: askPrice,
          qty: matchedQty,
        });
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

        FILLS.push({
          id: crypto.randomUUID(),
          buyOrderId: buyorder.id,
          sellOrderId: incoming.id,
          symbol,
          qty: matchedQty,
          price: buyprice,
        });
        console.log("FILL CREATED");

        console.log(FILLS[FILLS.length - 1]);
        incoming.filledqty += matchedQty;
        if (remaining === 0) {
          return remaining;
        }
      }
    }
  } else if (type === "MARKET" && side === "BUY") {
    const ask = ORDERBOOK[symbol].asks;
    const askOrders = Object.keys(ask)
      .map(Number)
      .sort((a, b) => a - b);
    for (const askPrice of askOrders) {
      const ordersAtPrice = ask[askPrice];
      for (const askOrder of ordersAtPrice) {
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
        flipBalance(userId, askOrder.userId, matchedQty, askPrice, symbol);
        console.log("MARKET BUY MATCH FOUND");

        console.log({
          buyerId: userId,
          sellerId: askOrder.userId,
          matchedQty,
          executionPrice: askPrice,
          remainingBeforeTrade: remaining,
        });

        FILLS.push({
          id: crypto.randomUUID(),
          buyOrderId: incoming.id,
          sellOrderId: askOrder.id,
          symbol,
          price: askPrice,
          qty: matchedQty,
        });
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
    // MARKET SELL
    const buy = ORDERBOOK[symbol].bids;
    const buyOrders = Object.keys(buy)
      .map(Number)
      .sort((a, b) => b - a);
    for (const buyPrice of buyOrders) {
      const ordersAtPrice = buy[buyPrice];
      for (const buyorder of ordersAtPrice) {
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

        FILLS.push({
          id: crypto.randomUUID(),
          buyOrderId: buyorder.id,
          sellOrderId: incoming.id,
          symbol,
          qty: matchedQty,
          price: buyPrice,
        });
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

while (1) {
  const response = await client.brPop("incoming-order", 1);
  if (!response) {
    continue;
  }
  const parsed = JSON.parse(response.element);

  if (parsed.req_type === "order") {
    const { type, price, qty, side, status, symbol, userId, identifier } = parsed;

    ensureUserBalance(userId);
    const requiredAmt = price * qty;

    if (side === "BUY" && type === "LIMIT") {
      if (BALANCES[userId].INR.available < requiredAmt) {
        publisherClient.lPush(
          "response-queue",
          JSON.stringify({
            identifier,
            success: false,
          }),
        );
        continue;
      }

      BALANCES[userId].INR.available -= requiredAmt;
      BALANCES[userId].INR.locked += requiredAmt;
    } else if (side === "SELL") {
      if (!BALANCES[userId][symbol] || BALANCES[userId][symbol].available < qty) {
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

    ORDERS.push(incoming);

    if (remainingQty > 0 && type === "LIMIT") {
      incoming.qty = remainingQty;
      if (side === "BUY") {
        if (!ORDERBOOK[symbol].bids[price]) {
          ORDERBOOK[symbol].bids[price] = [];
        }
        ORDERBOOK[symbol].bids[price].push(incoming);
      } else {
        if (!ORDERBOOK[symbol].asks[price]) {
          ORDERBOOK[symbol].asks[price] = [];
        }
        ORDERBOOK[symbol].asks[price].push(incoming);
      }
    }

    const filledQty = qty - remainingQty;
    console.log(filledQty);
    console.log(identifier);

    publisherClient.lPush(
      "response-queue",
      JSON.stringify({ filledQty, identifier, success: true }),
    );
  }
  
  else if (parsed.req_type === "delete-order") {
  const { orderId, currentUser, identifier } = parsed;

  const isOrder = ORDERS.find((o) => o.id === orderId);

  if (!isOrder) {
    publisherClient.lPush("response-queue", JSON.stringify({
      identifier,
      success: false,
      statusCode: 404,
      msg: "No order found against it bhai!! Sahab",
    }));
    continue;
  }

  if (isOrder.userId !== currentUser) {
    publisherClient.lPush("response-queue", JSON.stringify({
      identifier,
      success: false,
      statusCode: 403,
      msg: "Forbidden",
    }));
    continue;
  }

  if (isOrder.status === "FILLED" || isOrder.status === "CANCELLED") {
    publisherClient.lPush("response-queue", JSON.stringify({
      identifier,
      success: false,
      statusCode: 400,
      msg: "Order cannot be cancelled",
    }));
    continue;
  }

  const remainingQty = isOrder.qty - isOrder.filledqty;
  const totalAmt = remainingQty * isOrder.price;

  if (isOrder.side === "BUY") {
    BALANCES[currentUser].INR.available += totalAmt;
    BALANCES[currentUser].INR.locked -= totalAmt;

    const bidsAtPrice = ORDERBOOK[isOrder.symbol]?.bids[isOrder.price];
    if (bidsAtPrice) {
      ORDERBOOK[isOrder.symbol].bids[isOrder.price] =
        bidsAtPrice.filter((o) => o.id !== orderId);

      if (ORDERBOOK[isOrder.symbol].bids[isOrder.price].length === 0) {
        delete ORDERBOOK[isOrder.symbol].bids[isOrder.price];
      }
    }
  } else {
    BALANCES[currentUser][isOrder.symbol].available += remainingQty;
    BALANCES[currentUser][isOrder.symbol].locked -= remainingQty;

    const asksAtPrice = ORDERBOOK[isOrder.symbol]?.asks[isOrder.price];
    if (asksAtPrice) {
      ORDERBOOK[isOrder.symbol].asks[isOrder.price] =
        asksAtPrice.filter((o) => o.id !== orderId);

      if (ORDERBOOK[isOrder.symbol].asks[isOrder.price].length === 0) {
        delete ORDERBOOK[isOrder.symbol].asks[isOrder.price];
      }
    }
  }

  isOrder.status = "CANCELLED";

  publisherClient.lPush("response-queue", JSON.stringify({
    identifier,
    success: true,
    msg: "Order Cancelled",
  }));
  }
else if(parsed.req_type==="get orders"){
  console.log(ORDERS);
  const {userId , identifier} = parsed;
  const orders = ORDERS.filter((o) => o.userId === userId);
  publisherClient.lPush("response-queue",JSON.stringify({
    identifier,success:true,orders
  }))
}
else if (parsed.req_type === "get-orderbook") {
  const { symbol, identifier } = parsed;

  if (!ORDERBOOK[symbol]) {
    publisherClient.lPush("response-queue", JSON.stringify({
      identifier,
      success: false,
      statusCode: 404,
      msg: "Unknown symbol",
    }));
    continue;
  }

  const asks = Object.entries(ORDERBOOK[symbol].asks).map(([price, orders]) => ({
    price: Number(price),
    qty: orders.reduce((acc, curr) => acc + curr.qty, 0),
  }));

  const bids = Object.entries(ORDERBOOK[symbol].bids).map(([price, orders]) => ({
    price: Number(price),
    qty: orders.reduce((acc, curr) => acc + curr.qty, 0),
  }));

  publisherClient.lPush("response-queue", JSON.stringify({
    identifier,
    success: true,
    asks,
    bids,
  }));
  } else if (parsed.req_type === "get-fills") {
  const { symbol, identifier } = parsed;

  const fills = FILLS.filter((f) => f.symbol === symbol);

  publisherClient.lPush("response-queue", JSON.stringify({
    identifier,
    success: true,
    fills,
  }));
} else if (parsed.req_type === "get-stocks") {
  const { identifier } = parsed;

  publisherClient.lPush("response-queue", JSON.stringify({
    identifier,
    success: true,
    stocks: STOCKS,
  }));
}else if (parsed.req_type === "get-balance") {
  console.log("entered the queue")
  const { currentUser, identifier } = parsed;

  ensureUserBalance(currentUser);
  const balance = BALANCES[currentUser];

  publisherClient.lPush("response-queue", JSON.stringify({
    identifier,
    success: true,
    balance,
  }));
}
}


