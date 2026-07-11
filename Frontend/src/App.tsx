import { useOrderBook } from "./hooks/useOrderBook";
import { useTrades } from "./hooks/useTrades";

function App() {
  const {
    bids,
    asks,
    offset,
    loading,
    synced,
    error,
  } = useOrderBook("BTC");

  const { trades } = useTrades("BTC");

  if (loading) {
    return <div>Synchronizing orderbook...</div>;
  }

  return (
    <div>
      <h1>BTC MARKET</h1>

      {error && <p>{error}</p>}

      <p>Offset: {offset}</p>

      <p>
        Status: {synced ? "SYNCED" : "SYNCING"}
      </p>

      <hr />

      <h2>ASKS</h2>

      {asks.map(([price, qty]) => (
        <div key={price}>
          {price} | {qty}
        </div>
      ))}

      <hr />

      <h2>BIDS</h2>

      {bids.map(([price, qty]) => (
        <div key={price}>
          {price} | {qty}
        </div>
      ))}

      <hr />

      <h2>TRADES</h2>

      {trades.map((trade, index) => (
        <div key={index}>
          {trade.qty} BTC @ {trade.price}
        </div>
      ))}
    </div>
  );
}

export default App;