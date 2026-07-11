import type { Request, Response } from "express";
import { registerUser, authenticateUser } from "../services/auth.service";

export async function signup(req: Request, res: Response): Promise<any> {
  const { email, username, password } = req.body;
  const result = await registerUser(email, username, password);
  if (!result.success) {
    return res.status(result.statusCode || 400).json({ msg: result.msg });
  }
  return res.json({
    msg: "user created successfully",
    userId: result.userId,
  });
}

export async function login(req: Request, res: Response): Promise<any> {
  const { email, password } = req.body;
  const result = await authenticateUser(email, password);
  if (!result.success) {
    return res.status(result.statusCode || 400).json({ msg: result.msg || "wrong password" });
  }
  if (!result.isMatch) {
    return res.json({
      msg: "wrong password",
    });
  }
  return res.json({
    msg: "succesfull login ",
    token: result.token,
  });
}
