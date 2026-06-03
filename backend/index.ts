import express, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authcheck from "./authmiddleware";
import { randomUUID } from "node:crypto";

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

  const exists = USERS.find((user) => user.username === username);
  if (!exists) {
    res.json({
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

app.post("/orders", authcheck, async (req, res) => {
  const { userId, side, type, symbol, price, qty } = req.body;

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

  if (BALANCES[userId].INR.available < requiredAmt) {
    return res.json({
      msg: "Insufficient Balance",
    });
  }
  if ((side == "BUY")) {
    if (BALANCES[userId].INR.available < requiredAmt) {
    return res.json({
      msg: "Insufficient Balance",
        });
      }
    BALANCES[userId].INR.available -= requiredAmt;
    BALANCES[userId].INR.locked += requiredAmt;
  }
  else{
    if(!BALANCES[userId][symbol]){
        return res.json({
            msg:`You don't own this ${symbol} balance`
        })
    }
    if((BALANCES[userId][symbol].available)<qty){
        return res.json({
            msg:`insufficient  ${symbol} balance`
        })
    }
    BALANCES[userId][symbol].available -=qty;
    BALANCES[userId][symbol].locked +=qty;
  }
  const remainingQty = FilledOrders(incoming,userId, price, side, qty, type, symbol);

 if (remainingQty > 0) {
  const incoming: Order = {
    id: crypto.randomUUID(),
    userId,
    symbol,
    side,
    type,
    qty: remainingQty,
    price,
    filledQty: qty - remainingQty,
  };

  ORDERS.push(incoming);

  if (side === "BUY") {
    if (!ORDERBOOK[symbol].bids[price]) {
      ORDERBOOK[symbol].bids[price] = [];
    }

    ORDERBOOK[symbol].bids[price].push(order);
  } else {
    if (!ORDERBOOK[symbol].asks[price]) {
      ORDERBOOK[symbol].asks[price] = [];
    }

    ORDERBOOK[symbol].asks[price].push(order);
  }
}
return res.json({
    success: true,
    filledQty: qty - remainingQty,
    remainingQty
});

});

const FilledOrders = (incoming,userId, price, side, qty, type, symbol) => {
  let remaining = qty;

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
        } else {
          matchedQty = remaining;
          sellOrders.qty -= remaining;
          remaining = 0;
        }
        flipBalance(userId, sellOrders.userId, matchedQty, askPrice, symbol);
        if (remaining === 0) {
          break;
        }

        FILLS.push({
            id:crypto.randomUUID(),
            buyOrderId:incoming.id,
            sellOrderId:sellOrders.id,
            symbol,
            price:askPrice,
            qty:matchedQty
        })
        incoming.filledQty+=matchedQty;
      }
      if (remaining === 0) {
        break;
      }
    }
  } else if (type === "LIMIT" && side === "SELL") {
    const buys = ORDERBOOK[symbol].bids;
    const buyprices =   Object.keys(buys).map(Number).sort((a, b) => a - b);
    for(const buyprice of buyprices){
        if(buyprice<price){
            return;
        }
        const ordersAtPrice = buys[buyprice];
        for(const buyorder of ordersAtPrice){
            let matchedQty=0
            if(buyorder.qty>=remaining){
                matchedQty=remaining;
                buyorder.qty-=remaining;
                remaining=0;
            }else{
                matchedQty=buyorder.qty
                remaining-=buyorder.qty
                buyorder.qty=0
            }
            flipBalance(userId,buyorder.userId,matchedQty,buyprice,symbol)
            
            FILLS.push({
                id:crypto.randomUUID(),
                buyOrderId:buyorder.userId,
                sellOrderId:incoming.userId,
                symbol,
                qty:matchedQty,
                price:buyprice
            })
            incoming.filledQty+=matchedQty;
            if(remaining===0){
                return;
            }
        }
    }
  } else if (type === "MARKET" && side === "BUY") {
    const ask = ORDERBOOK[symbol].asks
    const askOrders = Object.keys(ask).map(Number).sort((a,b)=>a-b);
    for(const askPrice of askOrders){
        const ordersAtPrice = ask[askPrice]
        for(const askOrders of ordersAtPrice){
            let matchedQty = 0;
          if (askOrders.qty <= remaining) {
             matchedQty = askOrders.qty;
             remaining -= matchedQty;
            askOrders.qty = 0;
          } else {
          matchedQty = remaining;
          askOrders.qty -= remaining;
          remaining = 0;
        }
        flipBalance(userId, askOrders.userId, matchedQty, askPrice, symbol);
        if (remaining === 0) {
          break;
        }

        FILLS.push({
            id:crypto.randomUUID(),
            buyOrderId:incoming.id,
            sellOrderId:askOrders.id,
            symbol,
            price:askPrice,
            qty:matchedQty
        })
        incoming.filledQty+=matchedQty;
      }
      if (remaining === 0) {
        break;
      }
        }
    }

   else {
        const buy = ORDERBOOK[symbol].bids;
        const buyOrders = Object.keys(buy).map(Number).sort((a,b)=>b-a)
        for(const buyPrice of buyOrders){
            const ordersAtPrice = buy[buyPrice]
            for(const buyorder of ordersAtPrice){
            let matchedQty=0
            if(buyorder.qty>=remaining){
                matchedQty=remaining;
                buyorder.qty-=remaining;
                remaining=0;
            }else{
                matchedQty=buyorder.qty
                remaining-=buyorder.qty
                buyorder.qty=0
            }
            flipBalance(userId,buyorder.userId,matchedQty,buyPrice,symbol)
            
            FILLS.push({
                id:crypto.randomUUID(),
                buyOrderId:buyorder.id,
                sellOrderId:incoming.id,
                symbol,
                qty:matchedQty,
                price:buyPrice
            })
            incoming.filledQty+=matchedQty;
            if(remaining===0){
                return;
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
};
app.listen(3000, () => {
  console.log("HTTP established at http://127.0.0.1:3000");
});
