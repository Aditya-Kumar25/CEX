export interface EngineResponse {
  success: boolean;
  filledQty?: number;
  statusCode?: number;
  msg?: string;
  orders?: any[];
  asks?: { price: number; qty: number }[];
  bids?: { price: number; qty: number }[];
  offset?: number;
  fills?: any[];
  stocks?: any[];
  balance?: any;
}
