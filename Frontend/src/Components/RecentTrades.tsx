import type {
  Trade,
} from "../types/market";

type RecentTradesProps = {
  symbol: string;

  trades: Trade[];

  loading: boolean;

  error: string | null;
};

export default function RecentTrades({
  symbol,
  trades,
  loading,
  error,
}: RecentTradesProps) {
  return (
    <section className="flex flex-col h-full bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800 select-none">
      {/* Title Bar */}
      <div className="h-10 px-3 border-b border-zinc-800/80 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          Recent Trades
        </h2>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          Live Feed
        </span>
      </div>

      {error && (
        <div className="p-3 border-b border-zinc-800 bg-red-950/20">
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-zinc-500 animate-pulse font-medium">
            Loading trade history...
          </p>
        </div>
      )}

      {!loading && trades.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-zinc-500 font-sans">No trades executed yet.</p>
        </div>
      )}

      {!loading && trades.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto font-mono text-[11px]">
          {/* Table Headers */}
          <div className="grid grid-cols-2 px-3 py-1.5 text-zinc-500 font-sans text-[10px] tracking-wider uppercase border-b border-zinc-900/50">
            <div>Price (INR)</div>
            <div className="text-right">Qty ({symbol})</div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {trades.map((trade, index) => {
              // Determine color class by comparing price with previous (older) trade in list
              const nextTrade = trades[index + 1];
              const isUp = nextTrade ? trade.price >= nextTrade.price : true;
              const priceColor = isUp ? "text-emerald-400" : "text-rose-400";

              return (
                <div
                  key={trade.id ?? `${trade.price}-${trade.qty}-${index}`}
                  className="grid grid-cols-2 px-3 py-0.5 hover:bg-zinc-900/40 transition-colors"
                >
                  <span className={`text-left font-medium ${priceColor}`}>
                    {Number(trade.price).toFixed(2)}
                  </span>
                  <span className="text-zinc-400 text-right">
                    {Number(trade.qty).toFixed(4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}