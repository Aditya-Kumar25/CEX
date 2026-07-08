import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getBalance,
  type Balance as BalanceType,
} from "../Services/trading";

type BalanceProps = {
  refreshKey?: number;
};

export default function Balance({
  refreshKey,
}: BalanceProps) {
  const [balance, setBalance] =
    useState<BalanceType>({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const loadBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getBalance();

      setBalance(response.balance);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance, refreshKey]);

  if (loading) {
    return <p>Loading balance...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Balances</h2>

      {Object.entries(balance).map(
        ([asset, value]) => (
          <div key={asset}>
            <strong>{asset}</strong>

            <p>
              Available: {value.available}
            </p>

            <p>Locked: {value.locked}</p>
          </div>
        ),
      )}
    </div>
  );
}