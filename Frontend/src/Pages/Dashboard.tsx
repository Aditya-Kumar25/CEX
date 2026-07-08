import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext"
import OrderForm from "../Components/OrderForm";
import Balance from "../Components/Balance";
import UserOrders from "../Components/UseOrders";

import { useOrderBook } from "../hooks/useOrderBook";
import { useTrades } from "../hooks/useTrades";

export default function Dashboard() {
  const [symbol, setSymbol] =
    useState("BTC");

  const [refreshKey, setRefreshKey] =
    useState(0);

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

  function refreshUserData() {
    setRefreshKey((value) => value + 1);
  }

  const { logout } = useAuth();

  const navigate = useNavigate();

  function handleLogout() {
    logout();

    navigate("/login");
  }
  return (
    <div>
      <h1>CEX</h1>

      <button onClick={handleLogout}>
        Logout
      </button>
      <div>
        <button
          onClick={() => setSymbol("BTC")}
        >
          BTC
        </button>

        <button
          onClick={() => setSymbol("TESLA")}
        >
          TESLA
        </button>

        <button
          onClick={() => setSymbol("SPACEX")}
        >
          SPACEX
        </button>
      </div>

      <h2>{symbol} Market</h2>

      <p>Depth Offset: {offset}</p>

      <p>
        Market Data:{" "}
        {synced ? "SYNCED" : "SYNCING"}
      </p>

      {error && <p>{error}</p>}

      <hr />

      <div>
        <h2>Order Book</h2>

        {loading ? (
          <p>Synchronizing orderbook...</p>
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
      </div>

      <hr />

      <div>
        <h2>Recent Trades</h2>

        {tradesLoading && (
          <p>Loading trade history...</p>
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
              {trade.qty} {symbol} @ {trade.price}
            </div>
          ))}
      </div>

      <hr />

      <OrderForm
        symbol={symbol}
        onOrderPlaced={refreshUserData}
      />

      <hr />

      <Balance refreshKey={refreshKey} />

      <hr />

      <UserOrders
        refreshKey={refreshKey}
        onOrderChanged={refreshUserData}
      />
    </div>
  );
}