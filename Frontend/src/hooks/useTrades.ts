import {
  useEffect,
  useState,
} from "react";

import {
  getTradeManager,
} from "../market/tradeManager";

import type {
  Trade,
} from "../types/market";

export function useTrades(
  symbol: string,
): Trade[] {
  const manager = getTradeManager(symbol);

  const [trades, setTrades] = useState<Trade[]>(
    manager.getTrades(),
  );

  useEffect(() => {
    const updateTrades = () => {
      setTrades([...manager.getTrades()]);
    };

    const unsubscribeState =
      manager.subscribeState(updateTrades);

    manager.start();

    updateTrades();

    return () => {
      unsubscribeState();

      manager.stop();
    };
  }, [manager]);

  return trades;
}