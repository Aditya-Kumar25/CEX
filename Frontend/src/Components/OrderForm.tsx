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
  const [side, setSide] = useState<OrderSide>("BUY");
  const [type, setType] = useState<OrderType>("LIMIT");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage(null);

      const response = await placeOrder({
        type,
        price: type === "MARKET" ? 0 : Number(price),
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
      className="flex flex-col h-full bg-[#12111A] border-b lg:border-b-0 lg:border-r border-[#201D2D] select-none"
    >
      {/* Form Header */}
      <div className="h-10 px-3 border-b border-[#201D2D] flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
          New Order
        </h2>
        <span className="text-[10px] font-mono text-[#8E8A9F] uppercase tracking-wider font-bold">
          {symbol}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {/* BUY/SELL Toggle */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#1C1926] border border-[#2B273D]">
          <button
            type="button"
            onClick={() => setSide("BUY")}
            className={`text-xs font-bold py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              isBuy
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/20 border border-emerald-500/20"
                : "text-[#8E8A9F] hover:text-zinc-200 bg-transparent border-transparent"
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            className={`text-xs font-bold py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              !isBuy
                ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-950/20 border border-rose-500/20"
                : "text-[#8E8A9F] hover:text-zinc-200 bg-transparent border-transparent"
            }`}
          >
            SELL
          </button>
        </div>

        {/* Order Type Selector */}
        <div className="flex border-b border-[#201D2D]/30 pb-2">
          <button
            type="button"
            onClick={() => setType("LIMIT")}
            className={`text-xs font-bold mr-5 pb-1.5 relative transition-colors cursor-pointer ${
              type === "LIMIT"
                ? "text-white font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-500"
                : "text-[#8E8A9F] hover:text-zinc-200"
            }`}
          >
            LIMIT
          </button>
          <button
            type="button"
            onClick={() => setType("MARKET")}
            className={`text-xs font-bold pb-1.5 relative transition-colors cursor-pointer ${
              type === "MARKET"
                ? "text-white font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-500"
                : "text-[#8E8A9F] hover:text-zinc-200"
            }`}
          >
            MARKET
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 flex-1">
          {type === "LIMIT" && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-[#8E8A9F] tracking-wider">
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
                className="w-full bg-[#1C1926] border border-[#2B273D] focus:border-purple-650 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#5A566A] focus:outline-none font-mono transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-[#8E8A9F] tracking-wider">
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
              className="w-full bg-[#1C1926] border border-[#2B273D] focus:border-purple-650 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#5A566A] focus:outline-none font-mono transition-all"
            />
          </div>
        </div>

        {/* Submit & Message */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-xs font-bold py-3 rounded-lg transition-all cursor-pointer shadow-lg ${
              loading
                ? "bg-[#1C1926] text-[#5A566A] border border-[#2B273D] cursor-not-allowed shadow-none"
                : isBuy
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/20"
                : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/20"
            }`}
          >
            {loading ? "PLACING..." : `${side} ${symbol}`}
          </button>

          {message && (
            <div className="mt-3 p-3 rounded-lg bg-[#1C1926]/40 border border-[#2B273D] text-[10px] text-purple-300 font-mono break-all leading-relaxed">
              {message}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}