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
  // Find maximum quantities to calculate relative depth bar widths
  const maxAskQty = asks.length > 0 ? Math.max(...asks.map(([_, qty]) => qty)) : 1;
  const maxBidQty = bids.length > 0 ? Math.max(...bids.map(([_, qty]) => qty)) : 1;

  return (
    <section className="flex flex-col h-full bg-[#12111A] border-b lg:border-b-0 lg:border-r border-[#201D2D] select-none">
      {/* Header Panel */}
      <div className="h-10 px-3 border-b border-[#201D2D] flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
          Order Book
        </h2>
        <div className="flex items-center space-x-2 text-[10px]">
          <span className={`w-1.5 h-1.5 rounded-full ${synced ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"}`}></span>
          <span className="font-bold text-[#8E8A9F] uppercase tracking-wider">
            {synced ? "Synced" : "Syncing"}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 border-b border-[#201D2D] bg-rose-950/20">
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-[#8E8A9F] animate-pulse font-bold tracking-wide">
            Synchronizing orderbook...
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between font-mono text-[11px]">
          {/* Table Headers */}
          <div className="grid grid-cols-2 px-3 py-1.5 text-[#5A566A] font-sans text-[10px] font-bold tracking-wider uppercase border-b border-[#201D2D]/30">
            <div>Price (INR)</div>
            <div className="text-right">Size</div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* ASKS (Sells) */}
            <div className="flex-1 flex flex-col justify-end py-1">
              {asks.length === 0 ? (
                <div className="text-center text-[#5A566A] py-4 font-sans text-xs">No asks resting</div>
              ) : (
                asks.map(([price, qty]) => {
                  const barWidth = Math.max(2, Math.min(100, (qty / maxAskQty) * 100));
                  return (
                    <div
                      key={price}
                      className="relative grid grid-cols-2 px-3 py-0.5 hover:bg-[#1C1926]/40 transition-all duration-150 cursor-crosshair group"
                    >
                      {/* Depth Bar */}
                      <div 
                        className="absolute top-0 right-0 bottom-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-all duration-300 pointer-events-none"
                        style={{ width: `${barWidth}%` }}
                      />
                      <span className="relative z-10 text-rose-400 text-left font-bold">{Number(price).toFixed(2)}</span>
                      <span className="relative z-10 text-zinc-300 text-right font-medium">{Number(qty).toFixed(4)}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mid-market / Spread bar */}
            <div className="bg-[#1C1926]/40 border-y border-[#201D2D] px-3 py-1.5 flex items-center justify-between text-[#8E8A9F] font-sans text-[10px] tracking-wide">
              <span className="font-bold text-zinc-300">Spread Offset</span>
              <span className="font-mono font-bold text-purple-400">{offset}</span>
            </div>

            {/* BIDS (Buys) */}
            <div className="flex-1 flex flex-col py-1">
              {bids.length === 0 ? (
                <div className="text-center text-[#5A566A] py-4 font-sans text-xs">No bids resting</div>
              ) : (
                bids.map(([price, qty]) => {
                  const barWidth = Math.max(2, Math.min(100, (qty / maxBidQty) * 100));
                  return (
                    <div
                      key={price}
                      className="relative grid grid-cols-2 px-3 py-0.5 hover:bg-[#1C1926]/40 transition-all duration-150 cursor-crosshair group"
                    >
                      {/* Depth Bar */}
                      <div 
                        className="absolute top-0 right-0 bottom-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all duration-300 pointer-events-none"
                        style={{ width: `${barWidth}%` }}
                      />
                      <span className="relative z-10 text-emerald-400 text-left font-bold">{Number(price).toFixed(2)}</span>
                      <span className="relative z-10 text-zinc-300 text-right font-medium">{Number(qty).toFixed(4)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}