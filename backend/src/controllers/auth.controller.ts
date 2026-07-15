import type { Request, Response } from "express";
import { registerUser, authenticateUser, authenticateGoogleUser } from "../services/auth.service";

export async function signup(req: Request, res: Response): Promise<any> {
  try {
    const { email, username, password } = req.body;
    const result = await registerUser(email, username, password);
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        msg: result.msg || "Registration failed",
        message: result.msg || "Registration failed",
        error: result.msg || "Registration failed"
      });
    }
    return res.json({
      success: true,
      msg: "user created successfully",
      message: "user created successfully",
      userId: result.userId,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Auth Controller] Signup database/server exception:", error);
    return res.status(500).json({
      success: false,
      msg: "Registration encountered an internal database error",
      message: "Registration encountered an internal database error",
      error: errMsg
    });
  }
}

export async function login(req: Request, res: Response): Promise<any> {
  try {
    const { email, password } = req.body;
    const result = await authenticateUser(email, password);
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        msg: result.msg || "wrong credentials",
        message: result.msg || "wrong credentials",
        error: result.msg || "wrong credentials"
      });
    }
    if (!result.isMatch) {
      return res.status(400).json({
        success: false,
        msg: "wrong password",
        message: "wrong password",
        error: "wrong password"
      });
    }
    return res.json({
      success: true,
      msg: "succesfull login ",
      message: "succesfull login ",
      token: result.token,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Auth Controller] Login database/server exception:", error);
    return res.status(500).json({
      success: false,
      msg: "Login encountered an internal database error",
      message: "Login encountered an internal database error",
      error: errMsg
    });
  }
}

export async function googleAuth(req: Request, res: Response): Promise<any> {
  const { token } = req.body;
  console.log(`[Google Auth Controller] POST /auth/google request received. Token length: ${token?.length || 0}`);
  
  if (!token) {
    console.log(`[Google Auth Controller] Validation failed: missing token`);
    return res.status(400).json({
      success: false,
      msg: "Token is required",
      message: "Token is required",
      error: "Token is required"
    });
  }

  try {
    const result = await authenticateGoogleUser(token);
    if (!result.success) {
      console.log(`[Google Auth Controller] Verification failed: ${result.msg}`);
      return res.status(result.statusCode || 450).json({
        success: false,
        msg: result.msg,
        message: result.msg,
        error: result.msg
      });
    }
    
    console.log(`[Google Auth Controller] Verification succeeded for user: ${result.user.email}`);
    return res.json({
      success: true,
      msg: "successful login",
      message: "successful login",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error(`[Google Auth Controller] Exception thrown during verification:`, error);
    return res.status(401).json({
      success: false,
      msg: message,
      message: message,
      error: message
    });
  }
}
