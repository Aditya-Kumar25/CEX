import { subscribe, unsubscribe } from "../Services/Websocket";

import { getFills } from "../Services/api";

import type { Trade } from "../types/market";

type StateListener = () => void;

class TradeManager {
  private symbol: string;

  private trades: Trade[] = [];

  private tradeIds = new Set<string>();

  private buffer: Trade[] = [];

  private loading = true;

  private buffering = true;

  private error: string | null = null;

  private listeners = new Set<StateListener>();

  private started = false;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  private handleTrade = (value: unknown) => {
    const trade = value as Trade;

    if (
      typeof trade.symbol !== "string" ||
      typeof trade.price !== "number" ||
      typeof trade.qty !== "number"
    ) {
      return;
    }

    if (this.buffering) {
      this.buffer.push(trade);

      return;
    }

    this.addTrade(trade);

    this.emit();
  };

  private addTrade(trade: Trade) {
    if (trade.id && this.tradeIds.has(trade.id)) {
      return;
    }

    if (trade.id) {
      this.tradeIds.add(trade.id);
    }

    this.trades = [trade, ...this.trades].slice(0, 100);

    this.rebuildTradeIds();
  }

  private rebuildTradeIds() {
    this.tradeIds.clear();

    for (const trade of this.trades) {
      if (trade.id) {
        this.tradeIds.add(trade.id);
      }
    }
  }

  private async loadTrades() {
    try {
      this.loading = true;

      this.error = null;

      const fills = await getFills(this.symbol);

      this.trades = [];
      this.tradeIds.clear();

      const recentFills = fills.slice(-100).reverse();

      for (const fill of recentFills) {
        const trade: Trade = {
          id: fill.id,

          symbol: fill.symbol,

          price: fill.price,

          qty: fill.qty,
        };

        if (trade.id) {
          this.tradeIds.add(trade.id);
        }

        this.trades.push(trade);
      }

      for (const trade of this.buffer) {
        this.addTrade(trade);
      }

      this.buffer = [];

      this.buffering = false;

      this.loading = false;

      this.emit();
    } catch (error) {
      console.log("Trade history error:", error);

      this.loading = false;

      this.error = "Failed to load trade history";

      this.buffering = false;

      for (const trade of this.buffer) {
        this.addTrade(trade);
      }

      this.buffer = [];

      this.emit();
    }
  }

  public start() {
    if (this.started) {
      return;
    }

    this.started = true;

    this.buffering = true;

    subscribe(`trade.${this.symbol}`, this.handleTrade);

    this.loadTrades();
  }

  public stop() {
    if (!this.started) {
      return;
    }

    unsubscribe(`trade.${this.symbol}`, this.handleTrade);

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

  public getState() {
    return {
      trades: this.trades,

      loading: this.loading,

      error: this.error,
    };
  }
}

const tradeManagers = new Map<string, TradeManager>();

export function getTradeManager(symbol: string) {
  if (!tradeManagers.has(symbol)) {
    // tradeManagerCleanup(symbol);

    tradeManagers.set(symbol, new TradeManager(symbol));
  }

  return tradeManagers.get(symbol)!;
}

// function tradeManagerCleanup(symbol: string) {
//   if (tradeManagers.size < 10) {
//     return;
//   }

//   for (const key of tradeManagers.keys()) {
//     if (key !== symbol) {
//       tradeManagers.delete(key);

//       break;
//     }
//   }
// }
