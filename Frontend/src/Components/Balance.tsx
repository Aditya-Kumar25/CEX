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
    <section className="flex flex-col h-full bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800 select-none">
      {/* Title Bar */}
      <div className="h-10 px-3 border-b border-zinc-800/80 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          Balances
        </h2>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          Wallet
        </span>
      </div>

      {error && (
        <div className="p-3 border-b border-zinc-800 bg-red-950/20">
          <p className="text-xs text-rose-400 font-mono">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-zinc-500 animate-pulse font-medium">
            Loading balance...
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto font-mono text-[11px]">
          {/* Table Headers */}
          <div className="grid grid-cols-3 px-3 py-1.5 text-zinc-500 font-sans text-[10px] tracking-wider uppercase border-b border-zinc-900/50">
            <div>Asset</div>
            <div className="text-right">Available</div>
            <div className="text-right">Locked</div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {Object.entries(balance).length === 0 ? (
              <div className="text-center text-zinc-600 py-4 font-sans text-xs">No assets in wallet</div>
            ) : (
              Object.entries(balance).map(([asset, val]) => {
                const value = val as AssetBalance;
                return (
                  <div
                    key={asset}
                    className="grid grid-cols-3 px-3 py-1 hover:bg-zinc-900/40 transition-colors border-b border-zinc-900/20"
                  >
                    <span className="font-sans font-semibold text-zinc-200 text-left">
                      {asset}
                    </span>
                    <span className="text-zinc-300 text-right">
                      {Number(value.available).toFixed(4)}
                    </span>
                    <span className="text-zinc-500 text-right">
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