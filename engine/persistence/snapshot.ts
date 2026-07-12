import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SNAPSHOT_FILE_PATH = path.resolve(__dirname, "../snapshots/latest.json");
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
