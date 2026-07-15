import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getBalance,
  type UserBalance as BalanceType,
  type AssetBalance,
} from "../Services/trading";

type BalanceProps = {
  refreshKey?: number;
};

export default function Balance({
  refreshKey,
}: BalanceProps) {
  const [balance, setBalance] =
    useState<BalanceType>({} as BalanceType);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const loadBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getBalance();

      setBalance(response.balance);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance, refreshKey]);

  return (
    <section className="flex flex-col h-full bg-[#12111A] border-b lg:border-b-0 lg:border-r border-[#201D2D] select-none">
      {/* Title Bar */}
      <div className="h-10 px-3 border-b border-[#201D2D] flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
          Balances
        </h2>
        <span className="text-[10px] font-mono text-[#8E8A9F] uppercase tracking-wider font-bold">
          Wallet
        </span>
      </div>

      {error && (
        <div className="p-3 border-b border-[#201D2D] bg-rose-950/20">
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-[#8E8A9F] animate-pulse font-bold tracking-wide">
            Loading balance...
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto font-mono text-[11px]">
          {/* Table Headers */}
          <div className="grid grid-cols-3 px-3 py-1.5 text-[#5A566A] font-sans text-[10px] font-bold tracking-wider uppercase border-b border-[#201D2D]/30">
            <div>Asset</div>
            <div className="text-right">Available</div>
            <div className="text-right">Locked</div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {Object.entries(balance).length === 0 ? (
              <div className="text-center text-[#5A566A] py-4 font-sans text-xs">No assets in wallet</div>
            ) : (
              Object.entries(balance).map(([asset, val]) => {
                const value = val as AssetBalance;
                return (
                  <div
                    key={asset}
                    className="grid grid-cols-3 px-3 py-2 items-center hover:bg-[#1C1926]/40 transition-colors border-b border-[#201D2D]/10"
                  >
                    <div className="flex items-center space-x-1.5 text-left">
                      <span className="font-sans font-bold text-white bg-[#1C1926] border border-[#2B273D] px-2 py-0.5 rounded text-[10px] tracking-wide">
                        {asset}
                      </span>
                    </div>
                    <span className="text-zinc-200 text-right font-bold">
                      {Number(value.available).toFixed(4)}
                    </span>
                    <span className="text-[#8E8A9F] text-right font-medium">
                      {Number(value.locked).toFixed(4)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}