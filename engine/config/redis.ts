import { createClient } from "redis";

export const client = await createClient({})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export const publisherClient = await createClient({})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export const wsClient = await createClient({})
  .on("error", (e) => console.log("Redis Client Error", e))
  .connect();
