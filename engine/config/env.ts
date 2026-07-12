import path from "node:path";
import { fileURLToPath } from "node:url";

const requiredEnvVars = ["REDIS_URL"] as const;
const missing: string[] = [];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error(`[Error] Missing required environment variables in engine: ${missing.join(", ")}`);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const env = {
  REDIS_URL: process.env.REDIS_URL!,
  SNAPSHOT_PATH: process.env.SNAPSHOT_PATH ?? path.resolve(__dirname, "../snapshots/latest.json"),
};
