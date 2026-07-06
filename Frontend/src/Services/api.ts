import type { OrderBookSnapshot } from "../types/market";

const API_URL = "http://localhost:3000";

export async function getOrderBook(
  symbol: string,
): Promise<OrderBookSnapshot> {
  const response = await fetch(
    `${API_URL}/orderbook/${symbol}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch orderbook");
  }

  return response.json();
}