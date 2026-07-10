import {
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useState } from "react";

import OrderForm from "../Components/OrderForm";
import Balance from "../Components/Balance";
import UserOrders from "../Components/UserOrders";
import MarketSelector from "../Components/MarketSelector";
import OrderBook from "../Components/Orderbook";
import RecentTrades from "../Components/RecentTrades";
import MarketHeader from "../Components/MarketHeader";

import {
  useOrderBook,
} from "../hooks/useOrderBook";

import {
  useTrades,
} from "../hooks/useTrades";
  
import {
  useStocks,
} from "../hooks/useStocks";

import {
  useAuth,
} from "../Context/AuthContext";

export default function Dashboard() {
  const {
    symbol: routeSymbol,
  } = useParams();

  const navigate = useNavigate();

  const { logout } = useAuth();

  const {
    stocks,
    loading: stocksLoading,
    error: stocksError,
  } = useStocks();

  const [refreshKey, setRefreshKey] =
    useState(0);

  const symbol =
    routeSymbol?.toUpperCase();

  if (stocksLoading) {
    return <p>Loading exchange...</p>;
  }

  if (stocksError) {
    return <p>{stocksError}</p>;
  }

  const marketExists = stocks.some(
    (stock) => stock.symbol === symbol,
  );

  if (!symbol || !marketExists) {
    const defaultSymbol =
      stocks[0]?.symbol;

    if (!defaultSymbol) {
      return <p>No markets available.</p>;
    }

    return (
      <Navigate
        to={`/trade/${defaultSymbol}`}
        replace
      />
    );
  }

  function refreshUserData() {
    setRefreshKey(
      (value) => value + 1,
    );
  }

  function handleLogout() {
    logout();

    navigate("/login");
  }

  return (
    <TradingDashboard
      symbol={symbol}
      stocks={stocks}
      refreshKey={refreshKey}
      onRefresh={refreshUserData}
      onLogout={handleLogout}
    />
  );
}

type TradingDashboardProps = {
  symbol: string;

  stocks: {
    id: number;
    title: string;
    symbol: string;
  }[];

  refreshKey: number;

  onRefresh: () => void;

  onLogout: () => void;
};

function TradingDashboard({
  symbol,
  stocks,
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
    <main>
      <MarketHeader
        symbol={symbol}
        onLogout={onLogout}
      />

      <MarketSelector
        stocks={stocks}
        activeSymbol={symbol}
        loading={false}
        error={null}
      />

      <div>
        <OrderBook
          bids={bids}
          asks={asks}
          offset={offset}
          loading={loading}
          synced={synced}
          error={error}
        />

        <RecentTrades
          symbol={symbol}
          trades={trades}
          loading={tradesLoading}
          error={tradesError}
        />

        <OrderForm
          symbol={symbol}
          onOrderPlaced={onRefresh}
        />
      </div>

      <div>
        <Balance
          refreshKey={refreshKey}
        />

        <UserOrders
          refreshKey={refreshKey}
          onOrderChanged={onRefresh}
        />
      </div>
    </main>
  );
}