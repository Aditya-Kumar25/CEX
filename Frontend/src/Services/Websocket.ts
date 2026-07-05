type Listener = (value: unknown) => void;

type WSStreamMessage = {
  stream: string;
  value: unknown;
};

type WSAcknowledgement = {
  result: null;
  id: number;
};

const streamListeners: Record<string, Set<Listener>> = {};

let ws: WebSocket | null = null;
let requestId = 1;

function sendSubscribe(stream: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(
    JSON.stringify({
      method: "SUBSCRIBE",
      params: [stream],
      id: requestId++,
    }),
  );
}

function sendUnsubscribe(stream: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(
    JSON.stringify({
      method: "UNSUBSCRIBE",
      params: [stream],
      id: requestId++,
    }),
  );
}

export function connectWebSocket() {
  if (
    ws?.readyState === WebSocket.OPEN ||
    ws?.readyState === WebSocket.CONNECTING
  ) {
    return;
  }

  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => {
    console.log("WebSocket connected");

    for (const stream of Object.keys(streamListeners)) {
      if (streamListeners[stream].size > 0) {
        sendSubscribe(stream);
      }
    }
  };

  ws.onmessage = (event) => {
    let parsedData: WSStreamMessage | WSAcknowledgement;

    try {
      parsedData = JSON.parse(event.data);
    } catch {
      console.log("Invalid WebSocket message:", event.data);
      return;
    }

    if ("stream" in parsedData) {
      const listeners = streamListeners[parsedData.stream];

      if (!listeners) {
        return;
      }

      for (const listener of listeners) {
        listener(parsedData.value);
      }
    }
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");

    ws = null;
  };

  ws.onerror = (error) => {
    console.log("WebSocket Error:", error);
  };
}

export function subscribe(
  stream: string,
  listener: Listener,
) {
  connectWebSocket();

  if (!streamListeners[stream]) {
    streamListeners[stream] = new Set<Listener>();
  }

  const listeners = streamListeners[stream];

  const isFirstListener = listeners.size === 0;

  listeners.add(listener);

  if (isFirstListener) {
    sendSubscribe(stream);
  }
}

export function unsubscribe(
  stream: string,
  listener: Listener,
) {
  const listeners = streamListeners[stream];

  if (!listeners) {
    return;
  }

  listeners.delete(listener);

  if (listeners.size === 0) {
    sendUnsubscribe(stream);

    delete streamListeners[stream];
  }
}