import crypto from "node:crypto";
import { redisClient as client } from "../config/redis";
import { untilWeGotBack } from "../lib/untilWeGotBack";

export async function pushToQueueAndWait(payload: any, identifier?: string): Promise<any> {
  const id = identifier || crypto.randomUUID();
  console.log(`[Backend Queue] Pushing payload to Redis 'incoming-order' queue for identifier: ${id}. Payload type: ${payload.req_type}`);
  await client.lPush(
    "incoming-order",
    JSON.stringify({
      ...payload,
      identifier: id,
    }),
  );
  console.log(`[Backend Queue] Pushed to 'incoming-order', now waiting for response for identifier: ${id}`);
  return untilWeGotBack(id);
}
