import { redisSubscribeClient } from "../config/redis";

const pendingResolves: Record<string, Function> = {};

async function pollQueue() {
  const response = await redisSubscribeClient.brPop("response-queue", 1);

  if (!response) {
    return pollQueue();
  }

  const parsed = JSON.parse(response.element);

  console.log("QUEUE RESPONSE:", parsed);

  if (parsed.identifier) {
    const resolveFn = pendingResolves[parsed.identifier];
    if (resolveFn) {
      console.log("RESOLVING:", parsed.identifier);
      resolveFn(parsed);
      delete pendingResolves[parsed.identifier];
    }
  }

  pollQueue();
}

pollQueue();
console.log("gotbak k bahar");

export function untilWeGotBack(identifier: string) {
  console.log("gotback k andar");
  return new Promise((resolve) => {
    console.log("REGISTERING:", identifier);
    pendingResolves[identifier] = resolve;
  });
}
