import "dotenv/config";

console.log("DATABASE_URL =", process.env.DATABASE_URL);

import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
   connectionString:
    "postgresql://postgres:postgres@localhost:5432/CEX",
});
console.log(pool.options)
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});