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

while (1) {
  const response = await client.brPop("incoming-order", 1);
  if (!response) {
    continue;
  }
  const parsed = JSON.parse(response.element);
  if (parsed.req_type === "order") {
    const { type, price, qty, side, status, symbol, userId, identifier } =
      parsed;
    const requiredAmt = price * qty;

    if (side == "BUY" && type === "LIMIT") {
      if (BALANCES[userId].INR.available < requiredAmt) {
        publisherClient.lPush("response-queue", JSON.stringify({
          success:false,
        }));
        continue;
      }

      BALANCES[userId].INR.available-=requiredAmt;
      BALANCES[userId].INR.locked+=requiredAmt;
    }
    else if(side=="SELL"){
      if(!BALANCES[userId][symbol]){
      publisherClient.lPush("respnse-queue",JSON.stringify({
        success:false
      }));
      continue;
      }
    }
  }
  const filledQty = parsed.qty;
  console.log(filledQty);
  const identifier = parsed.identifier;
  console.log(identifier);
  publisherClient.lPush(
    "response-queue",
    JSON.stringify({ filledQty, identifier }),
  );
}
