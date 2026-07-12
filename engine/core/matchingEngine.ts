import type { Order } from "../types";
import { ORDERBOOK } from "./orderbook";
import { matchLimitBuy, matchLimitSell } from "./limitOrders";
import { matchMarketBuy, matchMarketSell } from "./marketOrders";

export function FilledOrders(
  incoming: Order,
  userId: string,
  price: number,
  side: "BUY" | "SELL",
  qty: number,
  type: "LIMIT" | "MARKET",
  symbol: string,
  status: string | undefined,
): number {
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
    return matchLimitBuy(incoming, userId, price, qty, symbol, status, qty);
  } else if (type === "LIMIT" && side === "SELL") {
    return matchLimitSell(incoming, userId, price, qty, symbol, status, qty);
  } else if (type === "MARKET" && side === "BUY") {
    return matchMarketBuy(incoming, userId, symbol, qty);
  } else {
    return matchMarketSell(incoming, userId, symbol, status, qty);
  }
}
