import { pushToQueueAndWait } from "./queue.service";

export async function createOrder(
  type: string,
  price: number,
  qty: number,
  side: string,
  symbol: string,
  userId: string,
  identifier: string,
) {
  return pushToQueueAndWait({
    type,
    price,
    qty,
    side,
    symbol,
    userId,
    req_type: "order",
  }, identifier);
}

export async function deleteOrder(orderId: string, currentUser: string, identifier: string) {
  return pushToQueueAndWait({
    req_type: "delete-order",
    orderId,
    currentUser,
  }, identifier);
}

export async function fetchOrders(userId: string, identifier: string) {
  return pushToQueueAndWait({
    req_type: "get orders",
    userId,
  }, identifier);
}
