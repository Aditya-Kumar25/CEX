import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

interface TokenPayload extends JwtPayload {
  userId: string;
}

export default function authcheck(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
    });
  }

  const token = authHeader.split(" ")[1]!;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string" || !("userId" in decoded)) {
      return res.status(401).json({
        success: false,
        error: "INVALID_TOKEN",
      });
    }

    req.userId = decoded.userId;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "INVALID_TOKEN",
    });
  }
}
