import { useNavigate } from "react-router-dom";

import type {
  Stock,
} from "../Services/trading";

type MarketSelectorProps = {
  stocks: Stock[];
  activeSymbol: string;
  loading: boolean;
  error: string | null;
};

export default function MarketSelector({
  stocks,
  activeSymbol,
  loading,
  error,
}: MarketSelectorProps) {
  const navigate = useNavigate();

  function selectMarket(symbol: string) {
    navigate(`/trade/${symbol}`);
  }

  if (loading) {
    return <p>Loading markets...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <nav>
      {stocks.map((stock) => (
        <button
          key={stock.id}
          type="button"
          onClick={() =>
            selectMarket(stock.symbol)
          }
          disabled={
            stock.symbol === activeSymbol
          }
        >
          {stock.title}
        </button>
      ))}
    </nav>
  );
}