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
    <section className="flex flex-col h-full bg-zinc-950 border-t border-zinc-800 select-none">
      {/* Title Bar */}
      <div className="h-10 px-3 border-b border-zinc-800/80 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          Your Orders
        </h2>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          Activity
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
            Loading orders...
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto font-mono text-[11px]">
          {/* Table Headers */}
          <div className="grid grid-cols-7 px-3 py-1.5 text-zinc-500 font-sans text-[10px] tracking-wider uppercase border-b border-zinc-900/50">
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
              <div className="text-center text-zinc-600 py-6 font-sans text-xs">No order history</div>
            ) : (
              orders.map((order) => {
                const isBuy = order.side === "BUY";
                const isCancelable = order.status === "OPEN" || order.status === "PARTIAL";

                return (
                  <div
                    key={order.id}
                    className="grid grid-cols-7 px-3 py-2 items-center hover:bg-zinc-900/40 transition-colors border-b border-zinc-900/10"
                  >
                    <span className="font-sans font-semibold text-zinc-200 text-left">
                      {order.symbol}
                    </span>
                    <span className="text-zinc-400 text-left">{order.type}</span>
                    <span className={`text-left font-semibold ${isBuy ? "text-emerald-400" : "text-rose-400"}`}>
                      {order.side}
                    </span>
                    <span className="text-zinc-300 text-right">
                      {Number(order.price).toFixed(2)}
                    </span>
                    <span className="text-zinc-300 text-right">
                      {Number(order.qty).toFixed(4)}
                    </span>
                    <span className="text-zinc-400 text-right">
                      {Number(order.filledqty).toFixed(4)}
                    </span>
                    <div className="flex items-center justify-end space-x-2">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        order.status === "FILLED"
                          ? "text-emerald-500"
                          : order.status === "CANCELLED"
                          ? "text-zinc-600"
                          : "text-amber-500"
                      }`}>
                        {order.status}
                      </span>
                      {isCancelable && (
                        <button
                          type="button"
                          onClick={() => handleCancel(order.id)}
                          className="text-[9px] uppercase font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer bg-zinc-900 px-2 py-0.5 border border-zinc-800 hover:border-zinc-700 rounded"
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