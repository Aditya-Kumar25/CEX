import type { UserBalance } from "../types";

export const BALANCES: Record<string, UserBalance> = {};

export function ensureUserBalance(userId: string) {
  if (!BALANCES[userId]) {
    BALANCES[userId] = {
      INR: { available: 1000000, locked: 0 },

      BTC: {
        available: 20,
        locked: 0,
      },
      TESLA: {
        available: 50,
        locked: 0,
      },
      SPACEX: {
        available: 50,
        locked: 0,
      },
    };
  }
}
