import { wsClient } from "../config/redis";

export const Depth_Update: Record<string, number> = {
  TESLA: 0,
  SPACEX: 0,
  BTC: 0,
};

export function pushDepthDelta(
  symbol: string,
  side: "bids" | "asks",
  price: number,
  qtyAtPrice: number,
) {
  const current = Depth_Update[symbol];
  if (current !== undefined) {
    Depth_Update[symbol] = current + 1;
  }

  wsClient.lPush(
    "ws-queue",
    JSON.stringify({
      stream: `depth.${symbol}`,
      value: {
        offset: Depth_Update[symbol],
        bids: side === "bids" ? [[price, qtyAtPrice]] : [],
        asks: side === "asks" ? [[price, qtyAtPrice]] : [],
      },
    }),
  );
}
