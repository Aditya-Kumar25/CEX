import type{Request,Response ,NextFunction} from "express";
import jwt  from "jsonwebtoken";
import { error } from "node:console";

function authcheck(req:Request,res:Response,next:NextFunction){
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success:false,
            error:"UNAUTHORIZED"
        })
    }

    const token = authHeader.split(" ")[1];

    try {
        
        const decoded:any = jwt.verify(token,"mysecret");
        (req as any).userId=decoded.userId;
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