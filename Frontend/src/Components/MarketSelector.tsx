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
      <div className="h-10 px-4 flex items-center border-b border-[#201D2D] bg-[#0E0D16]">
        <span className="text-xs text-[#8E8A9F] animate-pulse">Loading markets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-10 px-4 flex items-center border-b border-[#201D2D] bg-[#0E0D16]">
        <span className="text-xs text-rose-400 font-mono">{error}</span>
      </div>
    );
  }

  return (
    <nav className="h-10 px-4 border-b border-[#201D2D] bg-[#0E0D16] flex items-center space-x-2 overflow-x-auto select-none">
      <span className="text-[10px] text-[#5A566A] font-bold uppercase tracking-wider mr-2">
        Active Markets:
      </span>
      {stocks.map((stock) => {
        const isActive = stock.symbol === activeSymbol;
        return (
          <button
            key={stock.id}
            type="button"
            onClick={() => selectMarket(stock.symbol)}
            className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              isActive
                ? "text-white bg-[#1E1B2C] border-purple-800/40 shadow-sm shadow-purple-950/20"
                : "text-[#8E8A9F] border-transparent hover:text-zinc-200 hover:bg-[#1C1926]/30 hover:border-[#2B273D]/50"
            }`}
          >
            {stock.symbol}
          </button>
        );
      })}
    </nav>
  );
}