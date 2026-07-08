import type {
  Fill,
  OrderBookSnapshot,
} from "../types/market";

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

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.fills)) {
    return data.fills;
  }

  return [];
}