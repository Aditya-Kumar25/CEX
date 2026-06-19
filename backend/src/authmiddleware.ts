import type{Request,Response ,NextFunction} from "express";
import jwt  from "jsonwebtoken";
import { error } from "node:console";

function authcheck(req:Request,res:Response,next:NextFunction){
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success:false,
            error:"UNAUTHORIZED"
        })
    }

    const token = authHeader.split(" ")[1];
    console.log(token)

    try {
        const decoded:string = jwt.verify(token,"mysecret");
        (req as any).userId=decoded;
        next();
    } catch (e) {
        console.log(e)
        return  res.status(401).json({
            success:false,
            error:error
        })
    }
}

export default authcheck;