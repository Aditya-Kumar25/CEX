export type DepthLevel = [number, number];

export type DepthDelta = {
  offset: number;
  bids: DepthLevel[];
  asks: DepthLevel[];
};

export type OrderBookSnapshot = {
  offset: number;

  bids: {
    price: number;
    qty: number;
  }[];

  asks: {
    price: number;
    qty: number;
  }[];
};

export type OrderBookState = {
  offset: number;

  bids: DepthLevel[];

  asks: DepthLevel[];

  loading: boolean;

  synced: boolean;

  error: string | null;
};

export type Trade = {
  id?: string;

  symbol: string;

  price: number;

  qty: number;
};

export type Fill = {
  id: string;

  buyOrderId: string;

  sellOrderId: string;

  symbol: string;

  price: number;

  qty: number;
};