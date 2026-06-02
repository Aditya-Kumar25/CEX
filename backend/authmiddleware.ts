import type{Request,Response ,NextFunction} from "express";
import jwt  from "jsonwebtoken";

function authcheck(req:Request,res:Response,next:NextFunction){
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success:false,
            error:"UNAUTHORIZED"
        })
    }

    const token = authHeader.split('')[1];

    try {
        const decoded = jwt.verify(token as string,"mysecret")
        (req as any).user=decoded;
        next();
    } catch (e) {
        return  res.status(401).json({
            success:false,
            error:"SERVER ERROR"
        })
    }
}

export default authcheck;