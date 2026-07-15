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
    <section className="flex flex-col h-full bg-[#12111A] border-b lg:border-b-0 lg:border-r border-[#201D2D] select-none">
      {/* Title Bar */}
      <div className="h-10 px-3 border-b border-[#201D2D] flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
          Recent Trades
        </h2>
        <span className="text-[10px] font-mono text-[#8E8A9F] uppercase tracking-wider font-bold">
          Live Feed
        </span>
      </div>

      {error && (
        <div className="p-3 border-b border-[#201D2D] bg-rose-950/20">
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-[#8E8A9F] animate-pulse font-bold tracking-wide">
            Loading trade history...
          </p>
        </div>
      )}

      {!loading && trades.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-[#5A566A] font-medium">No trades executed yet.</p>
        </div>
      )}

      {!loading && trades.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto font-mono text-[11px]">
          {/* Table Headers */}
          <div className="grid grid-cols-2 px-3 py-1.5 text-[#5A566A] font-sans text-[10px] font-bold tracking-wider uppercase border-b border-[#201D2D]/30">
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
                  className="grid grid-cols-2 px-3 py-0.5 hover:bg-[#1C1926]/40 transition-colors"
                >
                  <span className={`text-left font-bold ${priceColor}`}>
                    {Number(trade.price).toFixed(2)}
                  </span>
                  <span className="text-zinc-300 text-right font-medium">
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