import { useNavigate } from "react-router-dom";

import type {
  Stock,
} from "../Services/trading";

type MarketSelectorProps = {
  stocks: Stock[];
  activeSymbol: string;
  loading: boolean;
  error: string | null;
};

export default function MarketSelector({
  stocks,
  activeSymbol,
  loading,
  error,
}: MarketSelectorProps) {
  const navigate = useNavigate();

  function selectMarket(symbol: string) {
    navigate(`/trade/${symbol}`);
  }

  if (loading) {
    return (
      <div className="h-10 px-4 flex items-center border-b border-zinc-800 bg-zinc-950/40">
        <span className="text-xs text-zinc-500">Loading markets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-10 px-4 flex items-center border-b border-zinc-800 bg-zinc-950/40">
        <span className="text-xs text-rose-500">{error}</span>
      </div>
    );
  }

  return (
    <nav className="h-10 px-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-1.5 overflow-x-auto select-none">
      <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mr-3">
        Markets:
      </span>
      {stocks.map((stock) => {
        const isActive = stock.symbol === activeSymbol;
        return (
          <button
            key={stock.id}
            type="button"
            onClick={() => selectMarket(stock.symbol)}
            className={`text-xs font-mono font-medium px-3 py-1 rounded border transition-all cursor-pointer ${
              isActive
                ? "text-zinc-100 bg-zinc-900 border-zinc-700/80"
                : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/30 hover:border-zinc-800"
            }`}
          >
            {stock.symbol}
          </button>
        );
      })}
    </nav>
  );
}