import {
  useEffect,
  useState,
} from "react";

import {
  getDepthManager,
} from "../market/depthManager";

import type {
  OrderBookState,
} from "../types/market";

export function useOrderBook(
  symbol: string,
): OrderBookState {
  const manager = getDepthManager(symbol);

  const [state, setState] = useState<OrderBookState>(
    manager.getState(),
  );

  useEffect(() => {
    const updateState = () => {
      setState(manager.getState());
    };

    const unsubscribeState =
      manager.subscribeState(updateState);

    manager.start();

    updateState();

    return () => {
      unsubscribeState();

      manager.stop();
    };
  }, [manager]);

  return state;
}