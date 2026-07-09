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
  useAuth,
} from "../Context/AuthContext";

import {
  isSupportedSymbol,
  type MarketSymbol,
} from "../types/symbol";

export default function Dashboard() {
  const {
    symbol: routeSymbol,
  } = useParams();

  const navigate = useNavigate();

  const { logout } = useAuth();

  const [refreshKey, setRefreshKey] =
    useState(0);

  const symbol =
    routeSymbol?.toUpperCase();

  if (
    !symbol ||
    !isSupportedSymbol(symbol)
  ) {
    return (
      <Navigate
        to="/trade/BTC"
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
      refreshKey={refreshKey}
      onRefresh={refreshUserData}
      onLogout={handleLogout}
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
    <main>
      <MarketHeader
        symbol={symbol}
        onLogout={onLogout}
      />

      <MarketSelector
        activeSymbol={symbol}
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