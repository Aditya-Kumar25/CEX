import { createClient } from "redis";
import { env } from "./env";

export const client = await createClient({
  url: env.REDIS_URL,
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export const publisherClient = await createClient({
  url: env.REDIS_URL,
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export const wsClient = await createClient({
  url: env.REDIS_URL,
})
  .on("error", (e) => console.log("Redis Client Error", e))
  .connect();
