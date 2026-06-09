import { createClient } from "redis";

let pendingResolves = {};
const subscribe = await createClient()
    .on("error",(err)=>{
        console.log("Redis client error",err)
    })
    .connect();
async function pollQueue() {
    const response = await subscribe.brPop("response-queue",1);
    if(!response){
        pollQueue()
    }else{
        const parsed = JSON.parse(response.element);
        if(parsed.identifier && pendingResolves[parsed.identifier]){
        pendingResolves[parsed.identifier]({filledQty:parsed.filledQty})
        }
        pollQueue();
    }
}
pollQueue();

export function untilWeGotBack(identifier:number){
    return new Promise((resolve,reject)=>{
        pendingResolves[identifier] = resolve;
    })
}