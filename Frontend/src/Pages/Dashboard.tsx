import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

import OrderForm from "../Components/OrderForm";
import Balance from "../Components/Balance";
import UserOrders from "../Components/UseOrders";
import MarketSelector from "../Components/MarketSelector";

import { useOrderBook } from "../hooks/useOrderBook";
import { useTrades } from "../hooks/useTrades";
import { useAuth } from "../Context/AuthContext";

import {
  isSupportedSymbol,
  type MarketSymbol,
} from "../types/symbol";

export default function Dashboard() {
  const { symbol: routeSymbol } = useParams();

  const navigate = useNavigate();

  const { logout } = useAuth();

  const [refreshKey, setRefreshKey] =
    useState(0);

  const symbol = routeSymbol?.toUpperCase();

  if (!symbol || !isSupportedSymbol(symbol)) {
    return <Navigate to="/trade/BTC" replace />;
  }

  return (
    <TradingDashboard
      symbol={symbol}
      refreshKey={refreshKey}
      onRefresh={() =>
        setRefreshKey((value) => value + 1)
      }
      onLogout={() => {
        logout();

        navigate("/login");
      }}
    />
  );
}

type TradingDashboardProps = {
  symbol: MarketSymbol;

  refreshKey: number;

  onRefresh: () => void;

  onLogout: () => void;
};

function TradingDashboard({
  symbol,
  refreshKey,
  onRefresh,
  onLogout,
}: TradingDashboardProps) {
  const {
    bids,
    asks,
    offset,
    loading,
    synced,
    error,
  } = useOrderBook(symbol);

  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
  } = useTrades(symbol);

  return (
    <div>
      <header>
        <h1>CEX</h1>

        <button onClick={onLogout}>
          Logout
        </button>
      </header>

      <MarketSelector
        activeSymbol={symbol}
      />

      <h2>{symbol} Market</h2>

      <p>Depth Offset: {offset}</p>

      <p>
        Market Data:{" "}
        {synced ? "SYNCED" : "SYNCING"}
      </p>

      {error && <p>{error}</p>}

      <hr />

      <section>
        <h2>Order Book</h2>

        {loading ? (
          <p>
            Synchronizing orderbook...
          </p>
        ) : (
          <>
            <h3>ASKS</h3>

            {asks.map(([price, qty]) => (
              <div key={price}>
                {price} | {qty}
              </div>
            ))}

            <h3>BIDS</h3>

            {bids.map(([price, qty]) => (
              <div key={price}>
                {price} | {qty}
              </div>
            ))}
          </>
        )}
      </section>

      <hr />

      <section>
        <h2>Recent Trades</h2>

        {tradesLoading && (
          <p>
            Loading trade history...
          </p>
        )}

        {tradesError && (
          <p>{tradesError}</p>
        )}

        {!tradesLoading &&
          trades.map((trade, index) => (
            <div
              key={
                trade.id ??
                `${trade.price}-${trade.qty}-${index}`
              }
            >
              {trade.qty} {symbol} @{" "}
              {trade.price}
            </div>
          ))}
      </section>

      <hr />

      <OrderForm
        symbol={symbol}
        onOrderPlaced={onRefresh}
      />

      <hr />

      <Balance refreshKey={refreshKey} />

      <hr />

      <UserOrders
        refreshKey={refreshKey}
        onOrderChanged={onRefresh}
      />
    </div>
  );
}