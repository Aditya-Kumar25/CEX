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
    return (
      <div className="min-h-screen bg-[#0C0C0E] flex items-center justify-center">
        <p className="text-sm text-zinc-500 animate-pulse">Loading exchange...</p>
      </div>
    );
  }

  if (stocksError) {
    return (
      <div className="min-h-screen bg-[#0C0C0E] flex items-center justify-center p-4">
        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded max-w-md">
          <p className="text-sm text-rose-400 font-mono">{stocksError}</p>
        </div>
      </div>
    );
  }

  const marketExists = stocks.some(
    (stock) => stock.symbol === symbol,
  );

  if (!symbol || !marketExists) {
    const defaultSymbol =
      stocks[0]?.symbol;

    if (!defaultSymbol) {
      return (
        <div className="min-h-screen bg-[#0C0C0E] flex items-center justify-center">
          <p className="text-sm text-zinc-500">No markets available.</p>
        </div>
      );
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
    <div className="min-h-screen max-h-screen flex flex-col bg-[#09080F] text-zinc-100 overflow-hidden">
      {/* Header */}
      <MarketHeader
        symbol={symbol}
        onLogout={onLogout}
      />

      {/* Market Selector */}
      <MarketSelector
        stocks={stocks}
        activeSymbol={symbol}
        loading={false}
        error={null}
      />

      {/* Main Terminal Workspace */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden select-none">
        
        {/* Top Split Panel (Grid of widgets) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 min-h-0 flex-1">
          {/* Order Book */}
          <div className="min-h-[350px] lg:min-h-0 lg:h-full">
            <OrderBook
              bids={bids}
              asks={asks}
              offset={offset}
              loading={loading}
              synced={synced}
              error={error}
            />
          </div>

          {/* Recent Trades */}
          <div className="min-h-[350px] lg:min-h-0 lg:h-full">
            <RecentTrades
              symbol={symbol}
              trades={trades}
              loading={tradesLoading}
              error={tradesError}
            />
          </div>

          {/* Order Entry Form */}
          <div className="min-h-[350px] lg:min-h-0 lg:h-full">
            <OrderForm
              symbol={symbol}
              onOrderPlaced={onRefresh}
            />
          </div>

          {/* Balances */}
          <div className="min-h-[350px] lg:min-h-0 lg:h-full">
            <Balance
              refreshKey={refreshKey}
            />
          </div>
        </div>

        {/* Bottom Activity Section (User Active/Closed Orders) */}
        <div className="h-[220px] shrink-0 border-t border-[#201D2D]">
          <UserOrders
            refreshKey={refreshKey}
            onOrderChanged={onRefresh}
          />
        </div>
      </div>
    </div>
  );
}