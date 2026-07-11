import {
  useState,
  type FormEvent,
} from "react";

import {
  placeOrder,
  type OrderSide,
  type OrderType,
} from "../Services/trading";

type OrderFormProps = {
  symbol: string;
  onOrderPlaced?: () => void;
};

export default function OrderForm({
  symbol,
  onOrderPlaced,
}: OrderFormProps) {
  const [side, setSide] =
    useState<OrderSide>("BUY");

  const [type, setType] =
    useState<OrderType>("LIMIT");

  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] = useState<
    string | null
  >(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage(null);

      const response = await placeOrder({
        type,
        price:
          type === "MARKET"
            ? 0
            : Number(price),
        qty: Number(qty),
        symbol,
        side,
      });

      setMessage(
        `${response.msg} | Filled: ${response.filledQty}`,
      );

      setQty("");

      if (type === "LIMIT") {
        setPrice("");
      }

      onOrderPlaced?.();
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const isBuy = side === "BUY";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col h-full bg-zinc-950 select-none"
    >
      {/* Form Header */}
      <div className="h-10 px-3 border-b border-zinc-800/80 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          New Order
        </h2>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          {symbol}
        </span>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between space-y-4">
        {/* BUY/SELL Toggle */}
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded bg-zinc-900 border border-zinc-800/80">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            className={`text-xs font-semibold py-1.5 rounded transition-all cursor-pointer ${
              isBuy
                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-500 hover:text-zinc-300 bg-transparent border-transparent"
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            className={`text-xs font-semibold py-1.5 rounded transition-all cursor-pointer ${
              !isBuy
                ? "bg-rose-950/40 text-rose-400 border border-rose-500/20"
                : "text-zinc-500 hover:text-zinc-300 bg-transparent border-transparent"
            }`}
          >
            SELL
          </button>
        </div>

        {/* Order Type Toggle */}
        <div className="flex border-b border-zinc-900 pb-2">
          <button
            type="button"
            onClick={() => setType("LIMIT")}
            className={`text-xs font-medium mr-4 pb-1 relative transition-colors cursor-pointer ${
              type === "LIMIT"
                ? "text-zinc-100 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            LIMIT
          </button>
          <button
            type="button"
            onClick={() => setType("MARKET")}
            className={`text-xs font-medium pb-1 relative transition-colors cursor-pointer ${
              type === "MARKET"
                ? "text-zinc-100 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            MARKET
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3 flex-1">
          {type === "LIMIT" && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Price (INR)
              </label>
              <input
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                required
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-zinc-700/80 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono transition-colors"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
              Quantity
            </label>
            <input
              type="number"
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              placeholder="0.0000"
              min="0"
              step="any"
              required
              className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-zinc-700/80 rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono transition-colors"
            />
          </div>
        </div>

        {/* Submit & Message */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-xs font-semibold py-2.5 rounded transition-all cursor-pointer ${
              loading
                ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                : isBuy
                ? "bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                : "bg-rose-600 hover:bg-rose-500 text-white font-medium"
            }`}
          >
            {loading ? "PLACING..." : `${side} ${symbol}`}
          </button>

          {message && (
            <div className="mt-2.5 p-2 rounded bg-zinc-900/40 border border-zinc-900 text-[10px] text-zinc-400 font-mono break-all">
              {message}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}