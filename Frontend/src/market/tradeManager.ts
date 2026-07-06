import {
  subscribe,
  unsubscribe,
} from "../Services/Websocket";

import type {
  Trade,
} from "../types/market";

type StateListener = () => void;

class TradeManager {
  private symbol: string;

  private trades: Trade[] = [];

  private listeners = new Set<StateListener>();

  private started = false;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  private handleTrade = (value: unknown) => {
    const trade = value as Trade;

    if (
      typeof trade.price !== "number" ||
      typeof trade.qty !== "number"
    ) {
      return;
    }

    this.trades = [
      trade,
      ...this.trades,
    ].slice(0, 100);

    this.emit();
  };

  public start() {
    if (this.started) {
      return;
    }

    this.started = true;

    subscribe(
      `trade.${this.symbol}`,
      this.handleTrade,
    );
  }

  public stop() {
    if (!this.started) {
      return;
    }

    unsubscribe(
      `trade.${this.symbol}`,
      this.handleTrade,
    );

    this.started = false;
  }

  public subscribeState(listener: StateListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getTrades() {
    return this.trades;
  }
}

const tradeManagers = new Map<
  string,
  TradeManager
>();

export function getTradeManager(symbol: string) {
  if (!tradeManagers.has(symbol)) {
    tradeManagers.set(
      symbol,
      new TradeManager(symbol),
    );
  }

  return tradeManagers.get(symbol)!;
}