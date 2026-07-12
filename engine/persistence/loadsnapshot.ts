import fs from "node:fs/promises";
import { SNAPSHOT_FILE_PATH, type SnapshotData } from "./snapshot";
import { ORDERBOOK, ORDERS } from "../core/orderbook";
import { BALANCES } from "../core/balance";
import { FILLS } from "../core/fills";
import { Depth_Update } from "../core/depth";

export async function loadSnapshot(): Promise<void> {
  try {
    let json: string;
    try {
      json = await fs.readFile(SNAPSHOT_FILE_PATH, "utf8");
    } catch (err: any) {
      if (err.code === "ENOENT") {
        console.log("[Snapshot] No snapshot file found. Starting with default empty state.");
        return;
      }
      throw err;
    }

    const data: SnapshotData = JSON.parse(json);

    if (!data.engine) {
      throw new Error("Invalid snapshot format: missing engine state");
    }

    const { orderbook, balances, orders, fills, depthOffset } = data.engine;

    // Mutate state in-place to preserve exported references:

    // 1. ORDERS
    if (Array.isArray(orders)) {
      ORDERS.length = 0;
      ORDERS.push(...orders);
    }

    // 2. FILLS
    if (Array.isArray(fills)) {
      FILLS.length = 0;
      FILLS.push(...fills);
    }

    // 3. ORDERBOOK
    if (orderbook && typeof orderbook === "object") {
      for (const key of Object.keys(ORDERBOOK)) {
        delete ORDERBOOK[key];
      }
      Object.assign(ORDERBOOK, orderbook);
    }

    // 4. BALANCES
    if (balances && typeof balances === "object") {
      for (const key of Object.keys(BALANCES)) {
        delete BALANCES[key];
      }
      Object.assign(BALANCES, balances);
    }

    // 5. Depth_Update (depthOffset)
    if (depthOffset && typeof depthOffset === "object") {
      for (const key of Object.keys(Depth_Update)) {
        delete Depth_Update[key];
      }
      Object.assign(Depth_Update, depthOffset);
    }

    console.log(`[Snapshot] Loaded successfully. Restored orders: ${ORDERS.length}, fills: ${FILLS.length}`);
  } catch (err) {
    console.error("[Snapshot] Load failed. Continuing with clean in-memory state:", err);
  }
}
