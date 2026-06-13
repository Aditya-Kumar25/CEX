import { createClient } from "redis";

const client   = await createClient({})
  .on("error",(err)=>console.log("Redis Client Error",err))
  .connect();


  const publisherClient   = await createClient({})
  .on("error",(err)=>console.log("Redis Client Error",err))
  .connect();

  while(1){
    const response = await client.brPop("incoming-order",1);
    if(!response){
        continue;
    }
    const parsed = JSON.parse(response.element);
    if(parsed.type === "market"){

    }
    const filledQty = parsed.price;
    const identifier = parsed.identifier;

     publisherClient.lPush("response-queue",JSON.stringify({filledQty,identifier}))

  }