import {
  useEffect,
  useState,
} from "react";

import {
  getStocks,
  type Stock,
} from "../Services/trading";

type StocksState = {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
};

export function useStocks(): StocksState {
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function loadStocks() {
      try {
        setLoading(true);
        setError(null);

        const data = await getStocks();

        setStocks(data);
      } catch (error) {
        console.log(
          "Failed to load stocks:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load markets",
        );
      } finally {
        setLoading(false);
      }
    }

    loadStocks();
  }, []);

  return {
    stocks,
    loading,
    error,
  };
}