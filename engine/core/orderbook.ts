import type { Stock, Order, SymbolOrderBook } from "../types";

export const STOCKS: Stock[] = [
  { id: 1, title: "TESLA", symbol: "TESLA" },
  { id: 2, title: "SpaceX", symbol: "SPACEX" },
  { id: 3, title: "BTC-USD", symbol: "BTC" },
];

export const ORDERS: Order[] = [];

export const ORDERBOOK: Record<string, SymbolOrderBook> = {
  TESLA: { bids: {}, asks: {} },
  SPACEX: { bids: {}, asks: {} },
  BTC: { bids: {}, asks: {} },
};
