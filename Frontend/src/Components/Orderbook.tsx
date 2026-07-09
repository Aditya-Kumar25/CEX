import type {
  DepthLevel,
} from "../types/market";

type OrderBookProps = {
  bids: DepthLevel[];

  asks: DepthLevel[];

  loading: boolean;

  synced: boolean;

  offset: number;

  error: string | null;
};

export default function OrderBook({
  bids,
  asks,
  loading,
  synced,
  offset,
  error,
}: OrderBookProps) {
  return (
    <section>
      <div>
        <h2>Order Book</h2>

        <p>
          {synced ? "SYNCED" : "SYNCING"}
        </p>

        <p>Offset: {offset}</p>
      </div>

      {error && <p>{error}</p>}

      {loading ? (
        <p>
          Synchronizing orderbook...
        </p>
      ) : (
        <div>
          <div>
            <h3>Price</h3>
            <h3>Quantity</h3>
          </div>

          <div>
            <h3>ASKS</h3>

            {asks.map(([price, qty]) => (
              <div key={price}>
                <span>{price}</span>

                <span>{qty}</span>
              </div>
            ))}
          </div>

          <div>
            <h3>BIDS</h3>

            {bids.map(([price, qty]) => (
              <div key={price}>
                <span>{price}</span>

                <span>{qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}