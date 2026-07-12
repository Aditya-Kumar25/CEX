import path from "node:path";
import { env } from "../config/env";

export const SNAPSHOT_FILE_PATH = path.resolve(env.SNAPSHOT_PATH);
export const SNAPSHOT_VERSION = "1.0.0";

export interface SnapshotData {
  version: string;
  createdAt: string;
  engine: {
    orderbook: any;
    balances: any;
    orders: any[];
    fills: any[];
    depthOffset: any;
  };
}
