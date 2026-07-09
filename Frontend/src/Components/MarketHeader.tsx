import type {
  MarketSymbol,
} from "../types/symbol";

type MarketHeaderProps = {
  symbol: MarketSymbol;

  onLogout: () => void;
};

export default function MarketHeader({
  symbol,
  onLogout,
}: MarketHeaderProps) {
  return (
    <header>
      <div>
        <h1>CEX</h1>

        <p>
          Centralized Exchange
        </p>
      </div>

      <div>
        <strong>
          {symbol} Market
        </strong>

        <button
          type="button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}