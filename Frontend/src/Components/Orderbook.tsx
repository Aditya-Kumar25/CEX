import type {
  DepthLevel,
} from "../types/market";

type OrderBookProps = {
  bids: DepthLevel[];

  asks: DepthLevel[];

  loading: boolean;

  synced: boolean;

  offset: number;

  error: string | null;
};

export default function OrderBook({
  bids,
  asks,
  loading,
  synced,
  offset,
  error,
}: OrderBookProps) {
  return (
    <section className="flex flex-col h-full bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800 select-none">
      {/* Header Panel */}
      <div className="h-10 px-3 border-b border-zinc-800/80 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          Order Book
        </h2>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className={`w-1.5 h-1.5 rounded-full ${synced ? "bg-emerald-500" : "bg-yellow-500"}`}></span>
          <span className="font-mono text-zinc-500 uppercase">
            {synced ? "Synced" : "Syncing"}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 border-b border-zinc-800 bg-red-950/20">
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-zinc-500 animate-pulse font-medium">
            Synchronizing orderbook...
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between font-mono text-[11px]">
          {/* Table Headers */}
          <div className="grid grid-cols-2 px-3 py-1.5 text-zinc-500 font-sans text-[10px] tracking-wider uppercase border-b border-zinc-900/50">
            <div>Price (INR)</div>
            <div className="text-right">Size</div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* ASKS (Sells) - Labeled container */}
            <div className="flex-1 flex flex-col justify-end py-1">
              {asks.length === 0 ? (
                <div className="text-center text-zinc-600 py-4 font-sans text-xs">No asks resting</div>
              ) : (
                asks.map(([price, qty]) => (
                  <div
                    key={price}
                    className="grid grid-cols-2 px-3 py-0.5 hover:bg-zinc-900/40 transition-colors"
                  >
                    <span className="text-rose-400 text-left font-medium">{Number(price).toFixed(2)}</span>
                    <span className="text-zinc-400 text-right">{Number(qty).toFixed(4)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Mid-market / Spread bar */}
            <div className="bg-zinc-900/30 border-y border-zinc-900 px-3 py-1 flex items-center justify-between text-zinc-400 font-sans text-[10px]">
              <span className="font-semibold text-zinc-300">Spread Offset</span>
              <span className="font-mono text-zinc-500">{offset}</span>
            </div>

            {/* BIDS (Buys) */}
            <div className="flex-1 flex flex-col py-1">
              {bids.length === 0 ? (
                <div className="text-center text-zinc-600 py-4 font-sans text-xs">No bids resting</div>
              ) : (
                bids.map(([price, qty]) => (
                  <div
                    key={price}
                    className="grid grid-cols-2 px-3 py-0.5 hover:bg-zinc-900/40 transition-colors"
                  >
                    <span className="text-emerald-400 text-left font-medium">{Number(price).toFixed(2)}</span>
                    <span className="text-zinc-400 text-right">{Number(qty).toFixed(4)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}