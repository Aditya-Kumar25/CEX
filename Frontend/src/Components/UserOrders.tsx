import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  cancelOrder,
  getOrders,
  type UserOrder,
} from "../Services/trading";

type UserOrdersProps = {
  refreshKey?: number;
  onOrderChanged?: () => void;
};

export default function UserOrders({
  refreshKey,
  onOrderChanged,
}: UserOrdersProps) {
  const [orders, setOrders] = useState<
    UserOrder[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getOrders();

      setOrders(response);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, refreshKey]);

  async function handleCancel(orderId: string) {
    try {
      await cancelOrder(orderId);

      await loadOrders();

      onOrderChanged?.();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  }

  return (
    <section className="flex flex-col h-full bg-[#12111A] border-t border-[#201D2D] select-none">
      {/* Title Bar */}
      <div className="h-10 px-3 border-b border-[#201D2D] flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
          Your Orders
        </h2>
        <span className="text-[10px] font-mono text-[#8E8A9F] uppercase tracking-wider font-bold">
          Activity
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
            Loading orders...
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto font-mono text-[11px]">
          {/* Table Headers */}
          <div className="grid grid-cols-7 px-3 py-1.5 text-[#5A566A] font-sans text-[10px] font-bold tracking-wider uppercase border-b border-[#201D2D]/30">
            <div>Market</div>
            <div>Type</div>
            <div>Side</div>
            <div className="text-right">Price</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Filled</div>
            <div className="text-right">Status</div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {orders.length === 0 ? (
              <div className="text-center text-[#5A566A] py-6 font-sans text-xs">No order history</div>
            ) : (
              orders.map((order) => {
                const isBuy = order.side === "BUY";
                const isCancelable = order.status === "OPEN" || order.status === "PARTIAL";

                return (
                  <div
                    key={order.id}
                    className="grid grid-cols-7 px-3 py-2 items-center hover:bg-[#1C1926]/40 transition-colors border-b border-[#201D2D]/10"
                  >
                    <span className="font-sans font-bold text-white text-left">
                      {order.symbol}
                    </span>
                    <span className="text-zinc-400 text-left">{order.type}</span>
                    <span className={`text-left font-bold ${isBuy ? "text-emerald-400" : "text-rose-400"}`}>
                      {order.side}
                    </span>
                    <span className="text-zinc-300 text-right font-semibold">
                      {Number(order.price).toFixed(2)}
                    </span>
                    <span className="text-zinc-300 text-right font-medium">
                      {Number(order.qty).toFixed(4)}
                    </span>
                    <span className="text-[#8E8A9F] text-right font-medium">
                      {Number(order.filledqty).toFixed(4)}
                    </span>
                    <div className="flex items-center justify-end space-x-2">
                      <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md border ${
                        order.status === "FILLED"
                          ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/30"
                          : order.status === "CANCELLED"
                          ? "bg-[#1C1926]/60 text-[#5A566A] border-[#2B273D]/60"
                          : "bg-amber-950/30 text-amber-400 border-amber-900/30"
                      }`}>
                        {order.status}
                      </span>
                      {isCancelable && (
                        <button
                          type="button"
                          onClick={() => handleCancel(order.id)}
                          className="text-[9px] uppercase font-bold text-rose-400 hover:text-white transition-all cursor-pointer bg-[#1C1926] hover:bg-rose-950/40 px-2 py-0.5 border border-[#2B273D] hover:border-rose-900/40 rounded-md"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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