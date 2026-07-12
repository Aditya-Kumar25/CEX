import fs from "node:fs/promises";
import path from "node:path";
import { SNAPSHOT_FILE_PATH, SNAPSHOT_VERSION, type SnapshotData } from "./snapshot";
import { ORDERBOOK, ORDERS } from "../core/orderbook";
import { BALANCES } from "../core/balance";
import { FILLS } from "../core/fills";
import { Depth_Update } from "../core/depth";

export async function saveSnapshot(): Promise<void> {
  try {
    const data: SnapshotData = {
      version: SNAPSHOT_VERSION,
      createdAt: new Date().toISOString(),
      engine: {
        orderbook: ORDERBOOK,
        balances: BALANCES,
        orders: ORDERS,
        fills: FILLS,
        depthOffset: Depth_Update,
      },
    };

    const dir = path.dirname(SNAPSHOT_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });

    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(SNAPSHOT_FILE_PATH, json, "utf8");
    console.log(`[Snapshot] Saved successfully at ${data.createdAt}`);
  } catch (err) {
    console.error("[Snapshot] Save failed:", err);
  }
}
