import express, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authcheck from "./authmiddleware";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import { createClient } from "redis";
import { untilWeGotBack } from "./untilwegotback";



const client   = await createClient({})
  .on("error",(err)=>console.log("Redis Client Error",err))
  .connect();

const app = express();

app.use(express.json());

interface Users { 
  id: string;
  username: string;
  password: string;
}

interface Stock {
  id: number;
  title: string;
  symbol: string;
}

type status = "FILLED" | "PARTIAL" | "OPEN" | "CLOSED" | "CANCELLED";

type Side = "BUY" | "SELL";

type OrderType = "LIMIT" | "MARKET";

interface Order {
  id: string;
  userId: string;
  symbol: string;
  side: Side;
  type: OrderType;
  qty: number;
  price: number;
  status: status;
  filledQty: number;
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

const USERS: Users[] = [];

const STOCKS: Stock[] = [
  { id: 1, title: "AXIS BANK", symbol: "AXIS" },
  { id: 2, title: "HDFC BANK", symbol: "HDFC" },
  { id: 3, title: "TATA Steel", symbol: "TATA" },
];

const ORDERS: Order[] = [];

const FILLS: Fill[] = [];

const BALANCES: Record<string, UserBalance> = {};

const ORDERBOOK: Record<string, SymbolOrderBook> = {
  AXIS: { bids: {}, asks: {} },
  HDFC: { bids: {}, asks: {} },
  TATA: { bids: {}, asks: {} },
};

app.post("/signup", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const exists = USERS.find((user) => user.username === username);
  if (exists) {
    return res.json({
      msg: "username already taken",
    });
  }

  const salt = 10;
  const HashedPassword = await bcrypt.hash(password, salt);

  const user: Users = {
    id: crypto.randomUUID(),
    username,
    password: HashedPassword,
  };

  USERS.push(user);

  BALANCES[user.id] = {
    INR: {
      available: 0,
      locked: 0,
    },
  };

  console.log(USERS);

  res.json({
    msg: "user created successfully",
    userId: user.id,
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const exists = await USERS.find((user) => user.username === username);
  if (!exists) {
    return res.json({
      msg: "wrong creds",
    });
  }

  const isMatch = await bcrypt.compare(password, exists.password);

  if (!isMatch) {
    return res.json({
      msg: "wrong password",
    });
  }
  const token = jwt.sign(
    {
      username: exists?.username,
    },
    "mysecret",
  );

  return res.json({
    msg: "succesfull login ",
    token,
  });
});
app.get("/seed", (req, res) => {
  const buyer = USERS.find((u) => u.username === "Pahla User");
  const seller = USERS.find((u) => u.username === "Dusra User");

  if (!buyer || !seller) {
    return res.json({
      msg: "Create users first",
    });
  }

  BALANCES[buyer.id].INR.available = 10000;

  BALANCES[seller.id]["AXIS"] = {
    available: 100,
    locked: 0,
  };

  res.json({
    msg: "seeded",
  });
});


app.post("/order", async (req, res) => {
    // matching
    const userId = req.userId;
    const {type, price, qty, market_id, side} = req.body;
    const identifier = Math.random();
    await client.lPush("incoming-order", JSON.stringify({
        type, price, qty, market_id, side, userId, identifier
    }))

    const returnedData = await untilWeGotBack(identifier);

    res.json({msg:"Order Placed",filledQty:returnedData})

})






app.post("/orders", authcheck, async (req, res) => {
  const { userId, side, type, symbol, price, qty, status } = req.body;

  //userId check
  const user = USERS.find((u) => u.id === userId);
  if (!user) {
    return res.json({
      msg: "User not found",
    });
  }
  //side check
  if (side !== "BUY" && side !== "SELL") {
    return res.json({
      msg: "wrong order side",
    });
  }
  //type check
  if (type === "LIMIT" && (typeof price !== "number" || price <= 0)) {
    return res.json({
      msg: "invalid price",
    });
  }
  //symbol check
  const stock = STOCKS.find((s) => s.symbol === symbol);
  if (!stock) {
    return res.json({
      msg: "Stock doesn't exists",
    });
  }
  //qty check
  if (typeof qty !== "number" || qty <= 0) {
    return res.json({
      msg: "qty not valid",
    });
  }

  const requiredAmt = qty * price;

  console.log("====== NEW ORDER ======");
  console.log({
    userId,
    side,
    type,
    symbol,
    price,
    status,
    qty,
  });
  if (side == "BUY" && type === "LIMIT") {
    if (BALANCES[userId].INR.available < requiredAmt) {
      return res.json({
        msg: "Insufficient Balance",
      });
    }
    BALANCES[userId].INR.available -= requiredAmt;
    BALANCES[userId].INR.locked += requiredAmt;
  } else if (side == "SELL") {
    if (!BALANCES[userId][symbol]) {
      return res.json({
        msg: `You don't own this ${symbol} balance`,
      });
    }
    if (BALANCES[userId][symbol].available < qty) {
      return res.json({
        msg: `insufficient  ${symbol} balance`,
      });
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
    filledQty: 0,
  };

  console.log("BALANCES BEFORE MATCH");

  console.dir(BALANCES, {
    depth: null,
  });

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
  } else {
    incoming.status = "OPEN";
  }
  ORDERS.push(incoming);

  if (remainingQty > 0) {
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
  console.log("====== ORDER COMPLETE ======");

  console.log({
    orderId: incoming.id,
    filledQty: qty - remainingQty,
    remainingQty,
  });

  console.log("ORDERS COUNT");

  console.log(ORDERS.length);

  console.log("FILLS COUNT");

  console.log(FILLS.length);

  console.log("ORDERBOOK AFTER");

  console.dir(ORDERBOOK[symbol], {
    depth: null,
  });
  return res.json({
    success: true,
    filledQty: qty - remainingQty,
    remainingQty,
  });
});

app.delete("/order/:orderId", authcheck, (req, res) => {
  const { orderId } = req.body;
  const currentUser = (req as any).user.userId;

  const isOrder = ORDERS.find((o) => o.id === orderId);
  if (!isOrder) {
    return res.status(404).json({
      msg: "No order found against it bhai!! Sahab",
    });
  }
  if (isOrder.userId !== currentUser) {
    return res.status(403).json({
      msg: "Forbidden",
    });
  }
  if (isOrder.status === "FILLED" || isOrder.status === "CANCELLED") {
    return res.status(400).json({
      msg: "Order cannot be cancelled",
    });
  }
  const remainingQty = isOrder.qty - isOrder.filledQty;

  const totalAmt = remainingQty * isOrder.price;
  if (isOrder.side == "BUY") {
    BALANCES[currentUser].INR.available += totalAmt;
    BALANCES[currentUser].INR.locked -= totalAmt;

    ORDERBOOK[isOrder.symbol].bids[isOrder.price] = ORDERBOOK[
      isOrder.symbol
    ]?.bids[isOrder.price]?.filter((o) => o.id == orderId);

    if (ORDERBOOK[isOrder.symbol]?.bids[isOrder.price]?.length === 0) {
      delete ORDERBOOK[isOrder.symbol]?.bids[isOrder.price];
    }
  } else {
    BALANCES[currentUser][isOrder.symbol].available += remainingQty;
    BALANCES[currentUser][isOrder.symbol].locked -= remainingQty;

    ORDERBOOK[isOrder.symbol].asks[isOrder.price] = ORDERBOOK[
      isOrder.symbol
    ]?.asks[isOrder.price]?.filter((o) => o.id == orderId);

    if (ORDERBOOK[isOrder.symbol]?.bids[isOrder.price]?.length === 0) {
      delete ORDERBOOK[isOrder.symbol]?.bids[isOrder.price];
    }
  }

  isOrder.status = "CANCELLED";

  res.json({
    msg: "Order Cancelled",
  });
});

app.get("/orders/:userId", (req, res) => {
  const { userId } = req.params;
  const orders = ORDERS.filter((o) => o.userId === userId);

  return res.json({
    orders,
  });
});


app.get("/orderbook/:symbol",(req,res)=>{
  const asks = [];
  const bids = [];
  for(const price in ORDERBOOK[symbol].asks){
    const totalasks = ORDERBOOK[symbol].asks[price]
          .reduce((acc,curr)=>acc+curr.qty,0);
    asks.push(price,totalasks);
  }
  for(const price in ORDERBOOK[symbol].bids){
    const totalbids = ORDERBOOK[symbol].bids[price]
          .reduce((acc,curr)=>acc+curr.qty,0);
    bids.push(price,totalbids);
  }

  res.json({
    asks,bids
  })  
})
app.get("/fills/:symbol", (req,res)=>{
      const {symbol} = req.body();

      const fills = FILLS.filter((f)=>f.symbol === symbol);

      return res.json({
        fills
      })
})


app.get("/stocks", (req, res) => {
  res.json(STOCKS);
});

app.get("/balances",authcheck,(req,res)=>{
  const currentUser = (req as any).user.userId;
  
  const balance = BALANCES[currentUser];

  return res.json({
    balance
  })
})

const FilledOrders = (
  incoming,
  userId,
  price,
  side,
  qty,
  type,
  symbol,
  status: status,
) => {
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
        incoming.filledQty += matchedQty;
      }
      if (remaining === 0) {
        break;
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
          buyorder.status = buyorder.qty === remaining ? "FILLED" : "PARTIAL";
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
        flipBalance(buyOrder.userId, userId, matchedQty, buyprice, symbol);

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
        incoming.filledQty += matchedQty;
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
      for (const askOrders of ordersAtPrice) {
        let matchedQty = 0;
        if (askOrders.qty <= remaining) {
          matchedQty = askOrders.qty;
          remaining -= matchedQty;
          askOrders.qty = 0;
          askOrders.status = "FILLED";
        } else {
          matchedQty = remaining;
          askOrders.qty -= remaining;
          remaining = 0;
          askOrders.status = "PARTIAL";
        }
        flipBalance(userId, askOrders.userId, matchedQty, askPrice, symbol);
        console.log("MARKET BUY MATCH FOUND");

        console.log({
          buyerId: userId,
          sellerId: askOrders.userId,
          matchedQty,
          executionPrice: askPrice,
          remainingBeforeTrade: remaining,
        });

        FILLS.push({
          id: crypto.randomUUID(),
          buyOrderId: incoming.id,
          sellOrderId: askOrders.id,
          symbol,
          price: askPrice,
          qty: matchedQty,
        });
        incoming.filledQty += matchedQty;
      }
      if (remaining === 0) {
        break;
      }
    }
  } else {
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
          remaining = 0;
          buyorder.status = "PARTIAL";
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
        flipBalance(userId, buyorder.userId, matchedQty, buyPrice, symbol);

        FILLS.push({
          id: crypto.randomUUID(),
          buyOrderId: buyorder.id,
          sellOrderId: incoming.id,
          symbol,
          qty: matchedQty,
          price: buyPrice,
        });
        incoming.filledQty += matchedQty;
        if (remaining === 0) {
          return remaining;
        }
      }
    }
  }
  return remaining;
};

const flipBalance = (
  buyerId: string,
  sellerId: string,
  qty: number,
  price: number,
  symbol: string,
) => {
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
};

app.listen(3000, () => {
  console.log("active");
});
