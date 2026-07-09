import type {
  Trade,
} from "../types/market";

type RecentTradesProps = {
  symbol: string;

  trades: Trade[];

  loading: boolean;

  error: string | null;
};

export default function RecentTrades({
  symbol,
  trades,
  loading,
  error,
}: RecentTradesProps) {
  return (
    <section>
      <h2>Recent Trades</h2>

      {loading && (
        <p>Loading trade history...</p>
      )}

      {error && <p>{error}</p>}

      {!loading && trades.length === 0 && (
        <p>No trades yet.</p>
      )}

      {!loading && trades.length > 0 && (
        <div>
          <div>
            <span>Price</span>

            <span>Quantity</span>
          </div>

          {trades.map((trade, index) => (
            <div
              key={
                trade.id ??
                `${trade.price}-${trade.qty}-${index}`
              }
            >
              <span>{trade.price}</span>

              <span>
                {trade.qty} {symbol}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}