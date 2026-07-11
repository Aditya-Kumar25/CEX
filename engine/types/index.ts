export type side = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET";
export type status = "FILLED" | "PARTIAL" | "OPEN" | "CLOSED" | "CANCELLED";

export interface Stock {
  id: number;
  title: string;
  symbol: string;
}

export interface Order {
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

export interface Fill {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  symbol: string;
  price: number;
  qty: number;
}

export interface AssetBalance {
  available: number;
  locked: number;
}

export interface UserBalance {
  INR: AssetBalance;
  [asset: string]: AssetBalance;
}

export interface OrderBookSide {
  [price: string]: Order[];
}

export interface SymbolOrderBook {
  bids: OrderBookSide;
  asks: OrderBookSide;
}
