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

type TradeState = {
  trades: Trade[];

  loading: boolean;

  error: string | null;
};

export function useTrades(
  symbol: string,
): TradeState {
  const manager = getTradeManager(symbol);

  const [state, setState] =
    useState<TradeState>(
      manager.getState(),
    );

  useEffect(() => {
    const updateTrades = () => {
      setState({
        ...manager.getState(),

        trades: [
          ...manager.getState().trades,
        ],
      });
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

  return state;
}