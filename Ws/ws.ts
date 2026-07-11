import WebSocket, { WebSocketServer } from "ws";
import { createClient } from "redis";

const PORT = 8080;

const client = createClient().on("error", (err) =>
  console.log("Redis Client Error", err),
);

await client.connect();

const activeSubscriptions: Record<string, Set<WebSocket>> = {};

function subscribe(stream: string, socket: WebSocket) {
  if (!activeSubscriptions[stream]) {
    activeSubscriptions[stream] = new Set<WebSocket>();
  }

  activeSubscriptions[stream].add(socket);
}

function unsubscribe(stream: string, socket: WebSocket) {
  const subscribers = activeSubscriptions[stream];

  if (!subscribers) return;

  subscribers.delete(socket);

  if (subscribers.size === 0) {
    delete activeSubscriptions[stream];
  }
}

function isValidStream(stream: string) {
  return stream.startsWith("depth.") || stream.startsWith("trade.");
}

function removeSocketFromAll(socket: WebSocket) {
  for (const stream of Object.keys(activeSubscriptions)) {
    unsubscribe(stream, socket);
  }
}

async function poll() {
  while (true) {
    try {
      const data = await client.brPop("ws-queue", 0);

      if (!data) continue;

      let parsedData: {
        stream?: string;
        value?: unknown;
      };

      try {
        parsedData = JSON.parse(data.element);
      } catch (err) {
        console.log("Bad ws-queue payload, skipping:", data.element, err);

        continue;
      }

      if (!parsedData.stream) continue;

      const subscribers = activeSubscriptions[parsedData.stream];

      if (!subscribers || subscribers.size === 0) {
        continue;
      }

      const payload = JSON.stringify({
        stream: parsedData.stream,
        value: parsedData.value,
      });

      for (const socket of subscribers) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(payload);
        }
      }
    } catch (err) {
      console.log("WS queue polling error:", err);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

poll();

const wss = new WebSocketServer({
  port: PORT,
  host: "0.0.0.0",
});

console.log(`WS server listening on ws://localhost:${PORT}`);

wss.on("connection", (socket) => {
  console.log("WS CLIENT CONNECTED");

  socket.on("message", (data) => {
    let parsedData: {
      method?: string;
      params?: string[];
      id?: number;
    };

    try {
      parsedData = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (parsedData.method === "SUBSCRIBE" && parsedData.params) {
      for (const stream of parsedData.params) {
        if (!isValidStream(stream)) {
          continue;
        }
        subscribe(stream, socket);
      }

      socket.send(
        JSON.stringify({
          result: null,
          id: parsedData.id,
        }),
      );
    }

    if (parsedData.method === "UNSUBSCRIBE" && parsedData.params) {
      for (const stream of parsedData.params) {
        if (!isValidStream(stream)) {
          continue;
        }
        unsubscribe(stream, socket);
      }

      socket.send(
        JSON.stringify({
          result: null,
          id: parsedData.id,
        }),
      );
    }
  });

  socket.on("close", () => {
    console.log("WS CLIENT DISCONNECTED");

    removeSocketFromAll(socket);
  });

  socket.on("error", (err) => {
    console.log("WS SOCKET ERROR:", err);

    removeSocketFromAll(socket);
  });
});
