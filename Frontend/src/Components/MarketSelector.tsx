import { useNavigate } from "react-router-dom";

import {
  SUPPORTED_SYMBOLS,
  type MarketSymbol,
} from "../types/symbol";

type MarketSelectorProps = {
  activeSymbol: MarketSymbol;
};

export default function MarketSelector({
  activeSymbol,
}: MarketSelectorProps) {
  const navigate = useNavigate();

  function selectMarket(
    symbol: MarketSymbol,
  ) {
    navigate(`/trade/${symbol}`);
  }

  return (
    <div>
      {SUPPORTED_SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          type="button"
          onClick={() =>
            selectMarket(symbol)
          }
          disabled={symbol === activeSymbol}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}