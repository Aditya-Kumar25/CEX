import type {
  Fill,
  OrderBookSnapshot,
} from "../types/market";

import { API_URL } from "../config";

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

export async function getFills(
  symbol: string,
): Promise<Fill[]> {
  const response = await fetch(
    `${API_URL}/fills/${symbol}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch trades");
  }

  const data = await response.json();

  return data.fills;
}