import crypto from "node:crypto";
import { redisClient as client } from "../config/redis";
import { untilWeGotBack } from "../lib/untilWeGotBack";

export async function pushToQueueAndWait(payload: any, identifier?: string): Promise<any> {
  const id = identifier || crypto.randomUUID();
  await client.lPush(
    "incoming-order",
    JSON.stringify({
      ...payload,
      identifier: id,
    }),
  );
  return untilWeGotBack(id);
}
