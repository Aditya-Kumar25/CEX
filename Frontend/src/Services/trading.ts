import { apiRequest } from "./http";

export type OrderSide = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET";

export type PlaceOrderInput = {
  type: OrderType;
  price: number;
  qty: number;
  symbol: string;
  side: OrderSide;
};

export type BalanceItem = {
  available: number;
  locked: number;
};

export type Balance = Record<string, BalanceItem>;

export type UserOrder = {
  id: string;
  userId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  status: "OPEN" | "PARTIAL" | "FILLED" | "CANCELLED";
  price: number;
  filledqty: number;
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
    balance: Balance;
  }>("/balance");
}

export async function getOrders() {
  return apiRequest<UserOrder[]>("/getorder");
}

export async function cancelOrder(orderId: string) {
  return apiRequest<{
    msg: string;
  }>(`/order/${orderId}`, {
    method: "DELETE",
  });
}