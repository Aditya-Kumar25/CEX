import { pushToQueueAndWait } from "./queue.service";

export async function fetchOrderbook(symbol: string, identifier: string) {
  return pushToQueueAndWait({
    req_type: "get-orderbook",
    symbol,
  }, identifier);
}

export async function fetchFills(symbol: string, identifier: string) {
  return pushToQueueAndWait({
    req_type: "get-fills",
    symbol,
  }, identifier);
}

export async function fetchStocks(identifier: string) {
  return pushToQueueAndWait({
    req_type: "get-stocks",
  }, identifier);
}
