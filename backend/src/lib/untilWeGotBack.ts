import { redisSubscribeClient } from "../config/redis";

const pendingResolves: Record<string, Function> = {};

async function pollQueue() {
  // console.log("[Backend untilWeGotBack] Polling 'response-queue' using brPop...");
  const response = await redisSubscribeClient.brPop("response-queue", 1);

  if (!response) {
    return pollQueue();
  }

  console.log(`[Backend untilWeGotBack] Popped response from 'response-queue':`, response.element);
  
  let parsed: any;
  try {
    parsed = JSON.parse(response.element);
  } catch (err) {
    console.error(`[Backend untilWeGotBack] Failed to parse response element:`, err);
    return pollQueue();
  }

  if (parsed.identifier) {
    const resolveFn = pendingResolves[parsed.identifier];
    if (resolveFn) {
      console.log(`[Backend untilWeGotBack] Found pending promise for identifier: ${parsed.identifier}, resolving now`);
      resolveFn(parsed);
      delete pendingResolves[parsed.identifier];
    } else {
      console.log(`[Backend untilWeGotBack] No pending promise registered for identifier: ${parsed.identifier}`);
    }
  } else {
    console.log(`[Backend untilWeGotBack] Popped response has no identifier:`, parsed);
  }

  pollQueue();
}

pollQueue();

export function untilWeGotBack(identifier: string) {
  console.log(`[Backend untilWeGotBack] untilWeGotBack called for identifier: ${identifier}`);
  return new Promise((resolve) => {
    console.log(`[Backend untilWeGotBack] Registering pending promise for identifier: ${identifier}`);
    pendingResolves[identifier] = resolve;
  });
}
