import { createClient } from "redis";
import { env } from "./env";

export const redisClient = await createClient({
  url: env.REDIS_URL,
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export const redisSubscribeClient = await createClient({
  url: env.REDIS_URL,
})
  .on("error", (err) => {
    console.log("Redis client error", err);
  })
  .connect();
