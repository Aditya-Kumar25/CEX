import { createClient } from "redis";

const pendingResolves: Record<string, Function> = {};

const subscribe = await createClient()
  .on("error", (err) => {
    console.log("Redis client error", err);
  })
  .connect();

async function pollQueue() {
  const response = await subscribe.brPop("response-queue", 1);

  if (!response) {
    return pollQueue();
  }

  const parsed = JSON.parse(response.element);

  console.log("QUEUE RESPONSE:", parsed);

  if (
    parsed.identifier &&
    pendingResolves[parsed.identifier]
  ) {
    console.log("RESOLVING:", parsed.identifier);

    pendingResolves[parsed.identifier](parsed);

    delete pendingResolves[parsed.identifier];
  }

  pollQueue();
}

pollQueue();

export function untilWeGotBack(identifier: string) {
  return new Promise((resolve) => {
    console.log("REGISTERING:", identifier);
    pendingResolves[identifier] = resolve;
  });
}

