import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  cancelOrder,
  getOrders,
  type UserOrder,
} from "../Services/trading";

type UserOrdersProps = {
  refreshKey?: number;
  onOrderChanged?: () => void;
};

export default function UserOrders({
  refreshKey,
  onOrderChanged,
}: UserOrdersProps) {
  const [orders, setOrders] = useState<
    UserOrder[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getOrders();

      setOrders(response);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, refreshKey]);

  async function handleCancel(orderId: string) {
    try {
      await cancelOrder(orderId);

      await loadOrders();

      onOrderChanged?.();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  }

  if (loading) {
    return <p>Loading orders...</p>;
  }

  return (
    <div>
      <h2>Your Orders</h2>

      {error && <p>{error}</p>}

      {orders.map((order) => (
        <div key={order.id}>
          <p>
            {order.side} {order.symbol}
          </p>

          <p>
            {order.type} @ {order.price}
          </p>

          <p>Qty: {order.qty}</p>

          <p>
            Filled: {order.filledqty}
          </p>

          <p>Status: {order.status}</p>

          {(order.status === "OPEN" ||
            order.status === "PARTIAL") && (
            <button
              onClick={() =>
                handleCancel(order.id)
              }
            >
              Cancel
            </button>
          )}
        </div>
      ))}
    </div>
  );
}