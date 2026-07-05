# CEX — Centralized Exchange

A centralized exchange backend built from scratch to understand how order matching, order books, real-time market data, and exchange infrastructure work internally.

The project implements a custom in-memory matching engine, REST API layer, Redis-based service communication, and WebSocket streams for real-time depth and trade updates.

> This project is built for learning exchange architecture and backend system design. It is not intended for real-money trading.

---

## Overview

CEX is a simplified centralized exchange system where users can:

- Place LIMIT and MARKET orders
- Buy and sell supported assets
- View account balances
- View active and historical orders
- Cancel open orders
- Fetch order book snapshots
- Fetch trade fills
- Subscribe to real-time market depth
- Subscribe to real-time trade updates

The core matching logic is implemented from scratch using an in-memory order book.

---

## Architecture

```text
                         CLIENT
                            |
              +-------------+-------------+
              |                           |
            HTTP                          WS
              |                           |
              v                           v
        +-------------+            +-------------+
        | API Backend |            | WS Service  |
        +-------------+            +-------------+
              |                           ^
              | Redis Queue               |
              v                           | Redis Queue
        +-----------------------------------------+
        |              Redis                      |
        +-----------------------------------------+
              |                           ^
              v                           |
        +-----------------------------------------+
        |           Matching Engine               |
        |                                         |
        |  - Order validation                     |
        |  - Balance locking                      |
        |  - Price-time matching                  |
        |  - Order book management                |
        |  - Trade creation                       |
        |  - Balance settlement                   |
        |  - Depth delta generation               |
        +-----------------------------------------+
```

The API server does not directly modify the order book.

Order requests are pushed to Redis and processed by the matching engine. The engine owns the exchange state and sends responses back through Redis.

Real-time market events are pushed to a separate Redis queue and consumed by the WebSocket service.

---

## Project Structure

```text
CEX/
│
├── backend/
│   ├── API routes
│   ├── Authentication
│   ├── Redis request/response handling
│   └── Prisma database integration
│
├── engine/
│   ├── Matching engine
│   ├── Order book
│   ├── Balance management
│   ├── Trade settlement
│   ├── Depth delta generation
│   └── Offset management
│
├── ws/
│   ├── WebSocket server
│   ├── Stream subscriptions
│   ├── Stream unsubscriptions
│   └── Redis market event consumer
│
└── frontend/
    └── Exchange UI
```

---

## Matching Engine

The matching engine is the core of the exchange.

It currently supports four matching paths:

```text
LIMIT BUY
LIMIT SELL
MARKET BUY
MARKET SELL
```

### LIMIT BUY

A LIMIT BUY order consumes the lowest available asks while:

```text
askPrice <= buyPrice
```

Example:

```text
ASKS

101 -> 5 BTC
102 -> 3 BTC
105 -> 10 BTC

Incoming BUY
Price: 102
Qty: 7
```

Execution:

```text
5 BTC @ 101
2 BTC @ 102
```

The remaining ask depth becomes:

```text
102 -> 1 BTC
105 -> 10 BTC
```

---

### LIMIT SELL

A LIMIT SELL order consumes the highest available bids while:

```text
bidPrice >= sellPrice
```

The engine processes bid prices in descending order.

---

### MARKET Orders

MARKET orders consume the best available opposite-side price levels.

```text
MARKET BUY  -> consumes lowest ASKS
MARKET SELL -> consumes highest BIDS
```

MARKET orders never rest on the order book.

---

## Order Book

The order book is currently maintained in memory.

```ts
{
  BTC: {
    bids: {
      100: [Order, Order],
      99: [Order]
    },
    asks: {
      101: [Order],
      102: [Order, Order]
    }
  }
}
```

Multiple orders can exist at the same price level.

The public market depth aggregates all orders at a price.

Example:

```text
Order A -> 10 BTC @ 100
Order B -> 20 BTC @ 100
```

Public depth:

```text
100 -> 30 BTC
```

---

## Order Lifecycle

Orders can have the following states:

```text
OPEN
PARTIAL
FILLED
CANCELLED
```

Example:

```text
Incoming BUY 10 BTC
        |
        v
Matches 4 BTC
        |
        v
6 BTC remaining
        |
        v
Remaining 6 BTC rests on the order book
        |
        v
Order status = PARTIAL
```

---

## Balance Management

Each user maintains available and locked balances.

Example:

```json
{
  "INR": {
    "available": 8900,
    "locked": 1100
  }
}
```

When a LIMIT BUY order is placed:

```text
INR.available -= requiredAmount
INR.locked    += requiredAmount
```

When a SELL order is placed:

```text
ASSET.available -= qty
ASSET.locked    += qty
```

After a trade, the engine settles balances between the buyer and seller.

```text
BUYER

locked INR decreases
asset balance increases


SELLER

locked asset decreases
available INR increases
```

---

## Trade Fills

Every successful match creates a fill.

```ts
{
  id,
  buyOrderId,
  sellOrderId,
  symbol,
  price,
  qty
}
```

One incoming order can create multiple fills.

Example:

```text
MARKET BUY 10 BTC

ASK 2 @ 100
ASK 3 @ 101
ASK 5 @ 102
```

Creates:

```text
FILL 1 -> 2 @ 100
FILL 2 -> 3 @ 101
FILL 3 -> 5 @ 102
```

Each fill also produces a real-time trade event.

---

## Redis Communication

Redis is used for communication between services.

### Order Requests

```text
API Backend
     |
     | LPUSH
     v
incoming-order
     |
     | BRPOP
     v
Matching Engine
```

### Engine Responses

```text
Matching Engine
     |
     | LPUSH
     v
response-queue
     |
     | BRPOP
     v
API Backend
```

Each request contains a unique identifier.

```text
identifier -> pending Promise resolver
```

When the response returns, the backend resolves the corresponding HTTP request.

---

## WebSocket Service

The WebSocket service supports stream-based subscriptions.

Example:

```json
{
  "method": "SUBSCRIBE",
  "params": [
    "depth.BTC",
    "trade.BTC"
  ],
  "id": 1
}
```

Unsubscribe:

```json
{
  "method": "UNSUBSCRIBE",
  "params": [
    "depth.BTC"
  ],
  "id": 2
}
```

Subscriptions are stored as:

```text
stream -> WebSocket[]
```

Example:

```text
depth.BTC -> [socket1, socket2]

trade.BTC -> [socket2, socket3]
```

Only clients subscribed to a stream receive its events.

Disconnected sockets are removed from all active subscriptions.

---

## Real-Time Depth Stream

The engine publishes price-level deltas instead of sending the complete order book after every change.

Example initial depth:

```text
BIDS

100 -> 10
99  -> 20
```

If 5 quantity is removed from price 100, the engine sends:

```json
{
  "offset": 108,
  "bids": [
    [100, 5]
  ],
  "asks": []
}
```

The quantity represents the **latest total quantity at that price level**.

It is not the mathematical difference.

Incorrect:

```text
100 -> -5
```

Correct:

```text
100 -> 5
```

If a price level becomes empty:

```json
{
  "offset": 109,
  "bids": [
    [100, 0]
  ],
  "asks": []
}
```

The client removes the price level when quantity becomes `0`.

---

## Depth Offsets

Each symbol maintains an independent depth offset.

```ts
{
  BTC: 108,
  TESLA: 45,
  SPACEX: 21
}
```

Every depth mutation increments the symbol offset.

```text
BTC depth change
      |
      v
offset 107 -> 108
      |
      v
publish depth delta
```

Example stream:

```text
depth.BTC offset 105
depth.BTC offset 106
depth.BTC offset 107
depth.BTC offset 108
```

Offsets allow clients to synchronize WebSocket updates with HTTP order book snapshots.

---

## Snapshot Reconciliation

The order book uses an HTTP snapshot + WebSocket delta model.

The client first connects to the WebSocket and starts buffering depth events.

```text
WS BUFFER

105
106
107
108
109
110
```

Meanwhile, the client requests:

```text
GET /orderbook/BTC
```

The HTTP response contains:

```json
{
  "asks": [],
  "bids": [],
  "offset": 107
}
```

This means the snapshot contains all order book changes up to offset `107`.

The client discards:

```text
105
106
107
```

and applies:

```text
108
109
110
```

After reconciliation, new WebSocket deltas are applied directly.

```text
111 -> apply
112 -> apply
113 -> apply
```

This prevents order book updates from being lost while the HTTP snapshot is being fetched.

---

## Real-Time Trade Stream

Every fill creates a trade event.

Example:

```json
{
  "stream": "trade.BTC",
  "value": {
    "symbol": "BTC",
    "price": 101,
    "qty": 5
  }
}
```

If one incoming order matches multiple resting orders, multiple trade events are generated.

```text
Trade 1 -> 2 BTC @ 100
Trade 2 -> 3 BTC @ 101
Trade 3 -> 5 BTC @ 102
```

---

## API Endpoints

### Authentication

```text
POST /signup
POST /login
```

### Orders

```text
POST   /order
GET    /getorder
DELETE /order/:orderId
```

### Market Data

```text
GET /orderbook/:symbol
GET /fills/:symbol
GET /stocks
```

### Account

```text
GET /balance
```

---

## Tech Stack

### Backend

- TypeScript
- Bun
- Express.js
- Prisma
- PostgreSQL
- JWT
- bcrypt

### Infrastructure

- Redis
- Redis Lists
- WebSockets

### Frontend

- React
- TypeScript
- Tailwind CSS

---

## Running Locally

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd CEX
```

### 2. Install dependencies

Install dependencies inside each service.

```bash
cd backend
bun install

cd ../engine
bun install

cd ../ws
bun install
```

### 3. Start Redis

Make sure Redis is running locally.

### 4. Configure environment variables

Create the required `.env` files.

Example:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_connection_string
```

### 5. Start the API backend

```bash
cd backend
bun run index.ts
```

### 6. Start the matching engine

```bash
cd engine
bun run index.ts
```

### 7. Start the WebSocket service

```bash
cd ws
bun run ws.ts
```

---

## Current Architecture Decisions

The current version intentionally uses:

```text
Redis Queue instead of Kafka
In-memory order book
Single matching engine
Simple WebSocket subscriptions
Price-level depth deltas
Per-symbol depth offsets
HTTP snapshot reconciliation
```

These decisions keep the exchange architecture understandable while still implementing the core concepts behind a real-time trading system.

---

## Planned Improvements

- Persistent engine state
- Engine recovery after restart
- Order book snapshots
- Write-ahead event log
- Kafka-based event streaming
- Distributed matching by symbol
- Risk engine
- Ticker stream
- Candlestick / OHLC data
- Trade history persistence
- PostgreSQL order persistence
- WebSocket backpressure handling
- Sequence gap detection
- Engine metrics and monitoring

---

## What I Learned

Building this project helped me understand:

- How a matching engine processes orders
- Bid and ask price priority
- LIMIT and MARKET order execution
- Partial order fills
- Balance locking and settlement
- Order book price-level aggregation
- Redis-based inter-service communication
- Request-response correlation using identifiers
- WebSocket stream subscriptions
- Real-time trade streaming
- Price-level depth deltas
- Sequence offsets
- HTTP snapshot and WebSocket reconciliation
- Race conditions in real-time market data systems

---

## Disclaimer

This project is an educational implementation of a centralized exchange.

It does not provide the security, durability, regulatory compliance, risk controls, or financial guarantees required for production trading systems.
