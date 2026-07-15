type MarketHeaderProps = {
  symbol: string;

  onLogout: () => void;
};

export default function MarketHeader({
  symbol,
  onLogout,
}: MarketHeaderProps) {
  return (
    <header className="h-12 border-b border-[#201D2D] bg-[#12111A] px-4 flex items-center justify-between select-none">
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center space-x-1.5">
          <span className="text-sm font-black tracking-wider bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
            ALLINVEGAS
          </span>
          <span className="text-[9px] text-purple-300 font-bold px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-900/30 uppercase tracking-widest">
            Terminal
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Connection status and Active symbol tag */}
        <div className="flex items-center space-x-2 border-r border-[#201D2D] pr-4">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-200">
            {symbol} / INR
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="text-xs font-semibold text-[#8E8A9F] hover:text-white px-3 py-1 rounded-lg bg-[#1C1926] border border-[#2B273D] hover:border-purple-800/40 hover:bg-[#1E1B2C] transition-all cursor-pointer shadow-md"
        >
          Logout
        </button>
      </div>
    </header>
  );
}