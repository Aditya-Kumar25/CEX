import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import orderRouter from "./routes/order.routes";
import marketRouter from "./routes/market.routes";
import balanceRouter from "./routes/balance.routes";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Register routes
app.use(authRouter);
app.use(orderRouter);
app.use(marketRouter);
app.use(balanceRouter);

export default app;
