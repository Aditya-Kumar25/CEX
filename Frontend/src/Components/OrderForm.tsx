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

  return (
    <form onSubmit={handleSubmit}>
      <h2>Place Order</h2>

      <p>Symbol: {symbol}</p>

      <div>
        <button
          type="button"
          onClick={() => setSide("BUY")}
        >
          BUY
        </button>

        <button
          type="button"
          onClick={() => setSide("SELL")}
        >
          SELL
        </button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setType("LIMIT")}
        >
          LIMIT
        </button>

        <button
          type="button"
          onClick={() => setType("MARKET")}
        >
          MARKET
        </button>
      </div>

      {type === "LIMIT" && (
        <input
          type="number"
          value={price}
          onChange={(event) =>
            setPrice(event.target.value)
          }
          placeholder="Price"
          min="0"
          step="any"
          required
        />
      )}

      <input
        type="number"
        value={qty}
        onChange={(event) =>
          setQty(event.target.value)
        }
        placeholder="Quantity"
        min="0"
        step="any"
        required
      />

      <button
        type="submit"
        disabled={loading}
      >
        {loading
          ? "PLACING..."
          : `${side} ${symbol}`}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}