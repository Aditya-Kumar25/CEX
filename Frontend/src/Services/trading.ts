import { apiRequest } from "./http";

export type OrderSide = "BUY" | "SELL";

export type OrderType = "LIMIT" | "MARKET";

export type OrderStatus =
  | "FILLED"
  | "PARTIAL"
  | "OPEN"
  | "CLOSED"
  | "CANCELLED";

export type PlaceOrderInput = {
  type: OrderType;
  price: number;
  qty: number;
  symbol: string;
  side: OrderSide;
};

export type AssetBalance = {
  available: number;
  locked: number;
};

export type UserBalance = {
  INR: AssetBalance;
  [asset: string]: AssetBalance;
};

export type UserOrder = {
  id: string;
  userId: string;
  symbol: string;
  side: OrderSide;
  price: number;
  qty: number;
  type: OrderType;
  status: OrderStatus;
  filledqty: number;
};

export type Stock = {
  id: number;
  title: string;
  symbol: string;
};

export async function placeOrder(
  input: PlaceOrderInput,
) {
  return apiRequest<{
    msg: string;
    filledQty: number;
  }>("/order", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getBalance() {
  return apiRequest<{
    balance: UserBalance;
  }>("/balances");
}

export async function getOrders() {
  return apiRequest<UserOrder[]>("/getorder");
}

export async function cancelOrder(
  orderId: string,
) {
  return apiRequest<{
    msg: string;
  }>(`/order/${orderId}`, {
    method: "DELETE",
  });
}

export async function getStocks() {
  return apiRequest<Stock[]>("/stocks");
}