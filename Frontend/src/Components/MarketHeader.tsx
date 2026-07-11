type MarketHeaderProps = {
  symbol: string;

  onLogout: () => void;
};

export default function MarketHeader({
  symbol,
  onLogout,
}: MarketHeaderProps) {
  return (
    <header className="h-12 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between select-none">
      <div className="flex items-baseline space-x-2">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
          CEX
        </h1>
        <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">
          Terminal
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 border-r border-zinc-800 pr-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono font-medium text-zinc-300">
            {symbol} / INR
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="text-xs font-medium text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}