import {
  subscribe,
  unsubscribe,
} from "../Services/Websocket";

import { getOrderBook } from "../Services/api";

import type {
  DepthDelta,
  DepthLevel,
  OrderBookState,
} from "../types/market";

type StateListener = () => void;

class DepthManager {
  private symbol: string;

  private bids = new Map<number, number>();
  private asks = new Map<number, number>();

  private currentOffset = 0;

  private buffer: DepthDelta[] = [];

  private buffering = true;
  private synced = false;
  private loading = true;

  private error: string | null = null;

  private listeners = new Set<StateListener>();

  private started = false;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  private handleDepth = (value: unknown) => {
    const delta = value as DepthDelta;

    if (
      typeof delta.offset !== "number" ||
      !Array.isArray(delta.bids) ||
      !Array.isArray(delta.asks)
    ) {
      return;
    }

    if (this.buffering) {
      this.buffer.push(delta);

      return;
    }

    this.applyLiveDelta(delta);
  };

  private applyLevel(
    book: Map<number, number>,
    level: DepthLevel,
  ) {
    const [price, qty] = level;

    if (qty === 0) {
      book.delete(price);

      return;
    }

    book.set(price, qty);
  }

  private applyDelta(delta: DepthDelta) {
    for (const bid of delta.bids) {
      this.applyLevel(this.bids, bid);
    }

    for (const ask of delta.asks) {
      this.applyLevel(this.asks, ask);
    }

    this.currentOffset = delta.offset;
  }

  private applyLiveDelta(delta: DepthDelta) {
    if (delta.offset <= this.currentOffset) {
      return;
    }

    const expectedOffset = this.currentOffset + 1;

    if (delta.offset !== expectedOffset) {
      console.log(
        `DEPTH GAP DETECTED for ${this.symbol}`,
        {
          expected: expectedOffset,
          received: delta.offset,
        },
      );

      this.resync();

      return;
    }

    this.applyDelta(delta);

    this.emit();
  }

  private async loadSnapshot() {
    try {
      this.loading = true;
      this.error = null;

      const snapshot = await getOrderBook(this.symbol);

      this.bids.clear();
      this.asks.clear();

      for (const bid of snapshot.bids) {
        if (bid.qty > 0) {
          this.bids.set(bid.price, bid.qty);
        }
      }

      for (const ask of snapshot.asks) {
        if (ask.qty > 0) {
          this.asks.set(ask.price, ask.qty);
        }
      }

      this.currentOffset = snapshot.offset;

      this.buffer.sort(
        (a, b) => a.offset - b.offset,
      );

      for (const delta of this.buffer) {
        if (delta.offset <= this.currentOffset) {
          continue;
        }

        const expectedOffset =
          this.currentOffset + 1;

        if (delta.offset !== expectedOffset) {
          console.log(
            `BUFFER GAP DETECTED for ${this.symbol}`,
            {
              expected: expectedOffset,
              received: delta.offset,
            },
          );

          await this.resync();

          return;
        }

        this.applyDelta(delta);
      }

      this.buffer = [];

      this.buffering = false;
      this.synced = true;
      this.loading = false;

      this.emit();
    } catch (error) {
      console.log(
        "Orderbook snapshot error:",
        error,
      );

      this.loading = false;
      this.synced = false;
      this.error = "Failed to synchronize orderbook";

      this.emit();
    }
  }

  private async resync() {
    if (this.buffering) {
      return;
    }

    console.log(
      `Resynchronizing ${this.symbol} orderbook`,
    );

    this.buffering = true;
    this.synced = false;

    this.buffer = [];

    this.emit();

    await this.loadSnapshot();
  }

  public start() {
    if (this.started) {
      return;
    }

    this.started = true;

    this.buffering = true;

    subscribe(
      `depth.${this.symbol}`,
      this.handleDepth,
    );

    this.loadSnapshot();
  }

  public stop() {
    if (!this.started) {
      return;
    }

    unsubscribe(
      `depth.${this.symbol}`,
      this.handleDepth,
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

  public getState(): OrderBookState {
    const bids = Array.from(
      this.bids.entries(),
    ).sort((a, b) => b[0] - a[0]);

    const asks = Array.from(
      this.asks.entries(),
    ).sort((a, b) => a[0] - b[0]);

    return {
      bids,
      asks,
      offset: this.currentOffset,
      loading: this.loading,
      synced: this.synced,
      error: this.error,
    };
  }
}

const depthManagers = new Map<
  string,
  DepthManager
>();

export function getDepthManager(symbol: string) {
  if (!depthManagers.has(symbol)) {
    depthManagers.set(
      symbol,
      new DepthManager(symbol),
    );
  }

  return depthManagers.get(symbol)!;
}