import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

import { env } from "./config/env";

console.log("INDEX DB URL =", env.DATABASE_URL);
console.log("INDEX DB URL 1 =", env.DATABASE_URL);

import "./server";
