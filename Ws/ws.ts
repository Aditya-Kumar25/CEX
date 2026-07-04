import WebSocket, { WebSocketServer } from "ws";
import { createClient } from "redis";

const PORT = 8080;

const client = createClient().on("error", (err) =>
  console.log("Redis Client Error", err),
);

await client.connect();

const activeSubscriptions: Record<string, WebSocket[]> = {};

function subscribe(stream: string, socket: WebSocket) {
  if (!activeSubscriptions[stream]) {
    activeSubscriptions[stream] = [];
  }
  if (!activeSubscriptions[stream].includes(socket)) {
    activeSubscriptions[stream].push(socket);
  }
}

function unsubscribe(stream: string, socket: WebSocket) {
  if (!activeSubscriptions[stream]) return;

  activeSubscriptions[stream] = activeSubscriptions[stream].filter(
    (ws) => ws !== socket,
  );

  if (activeSubscriptions[stream].length === 0) {
    delete activeSubscriptions[stream];
  }
}

function removeSocketFromAll(socket: WebSocket) {
  for (const stream of Object.keys(activeSubscriptions)) {
    unsubscribe(stream, socket);
  }
}

async function poll() {
  while (true) {
    const data = await client.brPop("engine-outgoing", 0);
    if (!data) continue;

    const parsedData = JSON.parse(data.element);
    const subscribers = activeSubscriptions[parsedData.stream];
    if (!subscribers?.length) continue;

    const payload =
      typeof parsedData.value === "string"
        ? parsedData.value
        : JSON.stringify(parsedData.value);

    for (const ws of subscribers) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

poll();

const wss = new WebSocketServer({ port: PORT });
console.log(`WS server listening on ws://localhost:${PORT}`);

wss.on("connection", (socket) => {
  socket.on("message", (data) => {
    let parsedData: { method?: string; params?: string[]; id?: number };
    try {
      parsedData = JSON.parse(data.toString());
    } catch {
      return;
    }

    // {"method":"SUBSCRIBE","params":["trade.BTC","depth.BTC","ticker.BTC"],"id":1}
    if (parsedData.method === "SUBSCRIBE" && parsedData.params) {
      for (const param of parsedData.params) {
        subscribe(param, socket);
      }
      socket.send(JSON.stringify({ result: null, id: parsedData.id }));
    }

    if (parsedData.method === "UNSUBSCRIBE" && parsedData.params) {
      for (const param of parsedData.params) {
        unsubscribe(param, socket);
      }
      socket.send(JSON.stringify({ result: null, id: parsedData.id }));
    }
  });

  socket.on("close", () => {
    removeSocketFromAll(socket);
  });
});
