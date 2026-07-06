import express, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authcheck from "./authmiddleware";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import { createClient } from "redis";
import { untilWeGotBack } from "./untilwegotback";
console.log("INDEX DB URL =", process.env.DATABASE_URL);
import {prisma} from "../globalprisma"
import { Client } from "pg";
import cors from "cors";

console.log("INDEX DB URL 1=", process.env.DATABASE_URL);

const client   = await createClient({})
  .on("error",(err)=>console.log("Redis Client Error",err))
  .connect();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.post("/signup", async (req: Request, res: Response) => {
  const { email,username, password } = req.body;

  const exists = await prisma.user.findUnique({
    where:{
      email
    }
  });
  if (exists) {
    return res.json({
      msg: "username already taken",
    });
  }

  const salt = 10;
  const HashedPassword = await bcrypt.hash(password, salt);

   const userr = await prisma.user.create({
    data:{
      email,username,password:HashedPassword
    }
   })

 


  res.json({
    msg: "user created successfully",
    userId: userr.id,
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const exists =await prisma.user.findUnique({
    where:{
      username
    }
  })
  if (!exists) {
    return res.json({
      msg: "wrong creds",
    });
  }

  const isMatch = await bcrypt.compare(password, exists.password);

  if (!isMatch) {
    return res.json({
      msg: "wrong password",
    });
  }
  const token = jwt.sign(
    {
      userId: exists.id,
    },
    "mysecret",
  );

  return res.json({
    msg: "succesfull login ",
    token,
  });
});



app.post("/order",authcheck, async (req, res) => {
    const userId = (req as any).userId;
    console.log(userId);
    const req_type="order";
    const {type, price, qty,status,symbol, side} = req.body;

    if(side!=="BUY" && side!=="SELL"){
      return res.json({
        msg:"Invalid Side Selection"
      })
    }
    if(type === "LIMIT" && (typeof price != "number"|| price<=0)){
      return res.json({
        msg:"Invalid type or price"
      })
    }
    if(typeof qty !== "number" || qty<=0){
      return res.json({
        msg:"qty is not a valid qty"
      })
    }

    const identifier = crypto.randomUUID();
    
    console.log("ORDER RECEIVED:", identifier);
    await client.lPush("incoming-order", JSON.stringify({
        type, price, qty, side,status,symbol, userId, identifier,req_type
    }))

    console.log("WAITING FOR ENGINE:", identifier);
    const returnedData:any = await untilWeGotBack(identifier);
    console.log("RESPONSE FROM ENGINE:", returnedData);
    if(!returnedData.success){
         return res.status(402).json({
          msg:"Insufficient availability of amount/qty or no stock avl for this symbol"
        })
    }
    res.json({msg:"Order Placed",filledQty:returnedData})

})

app.delete("/order/:orderId", authcheck, async (req, res) => {
  const { orderId } = req.params;         
  const currentUser = (req as any).userId; 

  const req_type = "delete-order";
  const identifier = crypto.randomUUID();

  await client.lPush("incoming-order", JSON.stringify({
    req_type,
    orderId,
    currentUser,
    identifier,
  }));

  const returnedData: any = await untilWeGotBack(identifier);

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  res.json({ msg: "Order Cancelled" });
});

app.get("/getorder", authcheck, async(req, res) => {
  const userId = (req as any).userId;
  const req_type="get orders"
  const identifier = crypto.randomUUID();
    await client.lPush("incoming-order", JSON.stringify({
    req_type,
    userId,
    identifier,
  }))

 const returnedData:any = await untilWeGotBack(identifier);
 console.log("GET ORDERS RESPONSE", returnedData);
 if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }
  res.json(returnedData.orders)
});


app.get("/orderbook/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const req_type = "get-orderbook";
  const identifier = crypto.randomUUID();

  await client.lPush("incoming-order", JSON.stringify({
    req_type,
    symbol,
    identifier,
  }));

  const returnedData: any = await untilWeGotBack(identifier);

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  // offset now comes from the engine (Depth_Update[symbol] at the moment
  // this snapshot was built). Frontend needs this to know which WS
  // messages are "already included" in this snapshot vs "arrived after."
  res.json({
    asks: returnedData.asks,
    bids: returnedData.bids,
    offset: returnedData.offset,
  });
});

app.get("/fills/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const req_type = "get-fills";
  const identifier = crypto.randomUUID();

  await client.lPush("incoming-order", JSON.stringify({
    req_type,
    symbol,
    identifier,
  }));

  const returnedData: any = await untilWeGotBack(identifier);

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  res.json({ fills: returnedData.fills });
});


app.get("/stocks", async (req, res) => {
  const req_type = "get-stocks";
  const identifier = crypto.randomUUID();

  await client.lPush("incoming-order", JSON.stringify({
    req_type,
    identifier,
  }));

  const returnedData: any = await untilWeGotBack(identifier);

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  res.json(returnedData.stocks);
});

app.get("/balances", authcheck, async (req, res) => {
  const currentUser = (req as any).userId;
  const req_type = "get-balance";
  const identifier = crypto.randomUUID();

  await client.lPush("incoming-order", JSON.stringify({
    req_type,
    currentUser,
    identifier,
  }));
  console.log("Sending data to queue , babes")
  const returnedData: any = await untilWeGotBack(identifier);
  console.log(returnedData)

  if (!returnedData.success) {
    return res.status(returnedData.statusCode || 400).json({
      msg: returnedData.msg,
    });
  }

  res.json({ balance: returnedData.balance });
});

app.listen(3000, () => {
  console.log("active");
});
