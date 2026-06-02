import express, { type Request,type Response } from "express";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import authcheck from "./authmiddleware"

const app = express();

app.use(express.json());

interface Users{
    id:string,
    username:string,
    password:string
}

interface Stock{
    id:number,
    title:string,
    symbol:string
}

type Side = "BUY" | "SELL"

type OrderType = "LIMIT" | "MARKET"

interface Order{
    id:string,
    userId:string,
    symbol:string,
    side:Side,
    type:OrderType,
    qty:number,
    price:number,
    filledQty:number
}

interface Fill{
    id:string,
    buyOrderId:string,
    sellOrderId:string,
    symbol:string,
    price:number,
    qty:number
}

interface AssetBalance{
    available:number,
    locked:number,
}

interface UserBalance{
    INR:AssetBalance,
    [asset:string]:AssetBalance
}

interface OrderBookSide{
    [price:string]:Order[]
}

interface SymbolOrderBook{
    bids:OrderBookSide,
    asks:OrderBookSide
}


const USERS: Users[] = [];

const STOCKS:Stock[] = [
    { id: 1, title: "AXIS BANK", symbol: "AXIS" },
    { id: 2, title: "HDFC BANK", symbol: "HDFC" },
    { id: 3, title: "TATA Steel", symbol: "TATA" },
];

const ORDERS: Order[] = [];

const FILLS: Fill[] = [];

const BALANCES: Record<string, UserBalance> = {};

const ORDERBOOK: Record<string, SymbolOrderBook> = {
    AXIS: { bids: {}, asks: {} },
    HDFC: { bids: {}, asks: {} },
    TATA: { bids: {}, asks: {} },
};


app.post("/signup",async (req: Request, res: Response )=>{
    const {username,password} =req.body;

    const exists = USERS.find(
        (user)=>user.username ===  username
    )
    if(exists){
        return res.json({
            msg:"username already taken"
        })
    }

    const salt =10;
    const HashedPassword = await bcrypt.hash(password,salt);
    
    const user: Users={
        id: crypto.randomUUID(),
        username,
        password:HashedPassword
    }

    USERS.push(user)

    BALANCES[user.id]={
        INR:{
            available:0,
            locked:0,
        }
    }

    console.log(USERS)
    
    res.json({
        msg:"user created successfully",
        userId:user.id,
    })
})

app.post("/login",async (req,res)=>{
    const {username,password}=req.body;

    const exists=USERS.find(
        (user)=>user.username===username
    )
    if(!exists){
        res.json({
            msg:"wrong creds"
        })
    }

    const isMatch = await bcrypt.compare(
        password,exists.password
    )

    if(!isMatch){
        return res.json({
            msg:"wrong password"
        })
    }
    const token = jwt.sign({
        username:exists?.username,
        
    },"mysecret")

    return res.json({
        msg:"succesfull login ",token
    })
})

app.post("/orders" , async(req,res, authcheck)=>{
    const {userId , side , type , symbol,price ,qty} = req.body;
    
})

app.listen(3000,()=>{
    console.log("HTTP established at http://127.0.0.1:3000")
})