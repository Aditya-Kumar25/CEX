import { BALANCES } from "./balance";

export function flipBalance(
  buyerId: string,
  sellerId: string,
  qty: number,
  price: number,
  symbol: string,
  buyerPrice?: number,
) {
  const buyerBalance = BALANCES[buyerId];
  const sellerBalance = BALANCES[sellerId];

  if (!buyerBalance || !sellerBalance) {
    console.error("Buyer or seller balance not found during settlement");
    return;
  }

  const tradeAmount = qty * price;
  const buyerOriginalPrice = buyerPrice !== undefined ? buyerPrice : price;
  const lockedDeduct = qty * buyerOriginalPrice;
  const refund = lockedDeduct - tradeAmount;

  console.log("====== SETTLEMENT ======");

  console.log({
    buyerId,
    sellerId,
    qty,
    price,
    symbol,
    tradeAmount,
    buyerOriginalPrice,
    lockedDeduct,
    refund,
  });

  let buyerSymbolBalance = buyerBalance[symbol];
  if (!buyerSymbolBalance) {
    buyerSymbolBalance = { available: 0, locked: 0 };
    buyerBalance[symbol] = buyerSymbolBalance;
  }

  let sellerSymbolBalance = sellerBalance[symbol];
  if (!sellerSymbolBalance) {
    sellerSymbolBalance = { available: 0, locked: 0 };
    sellerBalance[symbol] = sellerSymbolBalance;
  }

  buyerBalance.INR.locked -= lockedDeduct;
  buyerBalance.INR.available += refund;
  buyerSymbolBalance.available += qty;

  sellerSymbolBalance.locked -= qty;
  sellerBalance.INR.available += tradeAmount;

  console.log("BUYER AFTER TRADE");

  console.dir(buyerBalance, {
    depth: null,
  });

  console.log("SELLER AFTER TRADE");

  console.dir(sellerBalance, {
    depth: null,
  });
}
