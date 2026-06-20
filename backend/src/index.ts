console.log("F0")
import express, { type Request, type Response } from "express";
console.log("Flag")
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
console.log("flag -1")
import authcheck from "./authmiddleware";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import { createClient } from "redis";
import { untilWeGotBack } from "./untilwegotback";
console.log("INDEX DB URL =", process.env.DATABASE_URL);
import {prisma} from "../globalprisma"
console.log("INDEX DB URL 1=", process.env.DATABASE_URL);

const client   = await createClient({})
  .on("error",(err)=>console.log("Redis Client Error",err))
  .connect();

const app = express();

app.use(express.json());


app.post("/signup", async (req: Request, res: Response) => {
  const { email,username, password } = req.body;

  console.log("1")
  const exists = await prisma.user.findUnique({
    where:{
      email
    }
  });
  console.log("2")
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

  BALANCES[userr.id] = {
    INR: {
      available: 0,
      locked: 0,
    },
  };

  console.log(USERS);

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

app.delete("/order/:orderId", authcheck, (req, res) => {
  const { orderId } = req.body;
  const currentUser = (req as any).user.userId;

  const isOrder = ORDERS.find((o) => o.id === orderId);
  if (!isOrder) {
    return res.status(404).json({
      msg: "No order found against it bhai!! Sahab",
    });
  }
  if (isOrder.userId !== currentUser) {
    return res.status(403).json({
      msg: "Forbidden",
    });
  }
  if (isOrder.status === "FILLED" || isOrder.status === "CANCELLED") {
    return res.status(400).json({
      msg: "Order cannot be cancelled",
    });
  }
  const remainingQty = isOrder.qty - isOrder.filledQty;

  const totalAmt = remainingQty * isOrder.price;
  if (isOrder.side == "BUY") {
    BALANCES[currentUser].INR.available += totalAmt;
    BALANCES[currentUser].INR.locked -= totalAmt;

    ORDERBOOK[isOrder.symbol].bids[isOrder.price] = ORDERBOOK[
      isOrder.symbol
    ]?.bids[isOrder.price]?.filter((o) => o.id == orderId);

    if (ORDERBOOK[isOrder.symbol]?.bids[isOrder.price]?.length === 0) {
      delete ORDERBOOK[isOrder.symbol]?.bids[isOrder.price];
    }
  } else {
    BALANCES[currentUser][isOrder.symbol].available += remainingQty;
    BALANCES[currentUser][isOrder.symbol].locked -= remainingQty;

    ORDERBOOK[isOrder.symbol].asks[isOrder.price] = ORDERBOOK[
      isOrder.symbol
    ]?.asks[isOrder.price]?.filter((o) => o.id == orderId);

    if (ORDERBOOK[isOrder.symbol]?.bids[isOrder.price]?.length === 0) {
      delete ORDERBOOK[isOrder.symbol]?.bids[isOrder.price];
    }
  }

  isOrder.status = "CANCELLED";

  res.json({
    msg: "Order Cancelled",
  });
});

app.get("/orders/:userId", (req, res) => {
  const { userId } = req.params;
  const orders = ORDERS.filter((o) => o.userId === userId);

  return res.json({
    orders,
  });
});


app.get("/orderbook/:symbol",(req,res)=>{
  const asks = [];
  const bids = [];
  for(const price in ORDERBOOK[symbol].asks){
    const totalasks = ORDERBOOK[symbol].asks[price]
          .reduce((acc,curr)=>acc+curr.qty,0);
    asks.push(price,totalasks);
  }
  for(const price in ORDERBOOK[symbol].bids){
    const totalbids = ORDERBOOK[symbol].bids[price]
          .reduce((acc,curr)=>acc+curr.qty,0);
    bids.push(price,totalbids);
  }

  res.json({
    asks,bids
  })  
})
app.get("/fills/:symbol", (req,res)=>{
      const {symbol} = req.body();

      const fills = FILLS.filter((f)=>f.symbol === symbol);

      return res.json({
        fills
      })
})


app.get("/stocks", (req, res) => {
  res.json(STOCKS);
});

app.get("/balances",authcheck,(req,res)=>{
  const currentUser = (req as any).user.userId;
  
  const balance = BALANCES[currentUser];

  return res.json({
    balance
  })
})

app.listen(3000, () => {
  console.log("active");
});
