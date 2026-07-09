export const SUPPORTED_SYMBOLS = [
  "BTC",
  "TESLA",
  "SPACEX",
] as const;

export type MarketSymbol =
  (typeof SUPPORTED_SYMBOLS)[number];

export function isSupportedSymbol(
  symbol: string,
): symbol is MarketSymbol {
  return SUPPORTED_SYMBOLS.includes(
    symbol as MarketSymbol,
  );
}