import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma";
import { env } from "../config/env";

export async function registerUser(email: string, username: string, password: string): Promise<any> {
  const exists = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (exists) {
    return { success: false, statusCode: 409, msg: "username already taken" };
  }

  const salt = 10;
  const HashedPassword = await bcrypt.hash(password, salt);

  const userr = await prisma.user.create({
    data: {
      email,
      username,
      password: HashedPassword,
    },
  });

  return { success: true, userId: userr.id };
}

export async function authenticateUser(email: string, password: string): Promise<any> {
  const exists = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!exists) {
    return { success: false, statusCode: 401, msg: "wrong creds" };
  }

  if (!exists.password) {
    return { success: false, statusCode: 401, msg: "Please sign in with Google" };
  }

  const isMatch = await bcrypt.compare(password, exists.password);

  if (!isMatch) {
    return { success: false, isMatch: false };
  }
  const token = jwt.sign(
    {
      userId: exists.id,
    },
    env.JWT_SECRET,
  );

  return { success: true, isMatch: true, token };
}

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token: string) {
  console.log(`[Google Verification Service] Received token length: ${token?.length || 0}, type: ${typeof token}`);
  
  try {
    const decoded = jwt.decode(token, { complete: true }) as any;
    if (decoded) {
      console.log(`[Google Verification Service] Decoded JWT Header:`, JSON.stringify(decoded.header));
      console.log(`[Google Verification Service] Decoded JWT Payload:`, JSON.stringify({
        iss: decoded.payload?.iss,
        aud: decoded.payload?.aud,
        exp: decoded.payload?.exp,
        sub: decoded.payload?.sub,
        email: decoded.payload?.email ? "present (obfuscated)" : "missing"
      }));
      const backendId = env.GOOGLE_CLIENT_ID || "";
      const last15Backend = backendId.length > 15 ? `...${backendId.slice(-15)}` : backendId;
      console.log(`[Google Verification Service] Configured Backend Client ID: ${last15Backend}`);
      
      const tokenAud = typeof decoded.payload?.aud === "string" ? decoded.payload.aud : "";
      const last15Aud = tokenAud.length > 15 ? `...${tokenAud.slice(-15)}` : tokenAud;
      console.log(`[Google Verification Service] Token Audience: ${last15Aud}`);
      console.log(`[Google Verification Service] Token Issuer: ${decoded.payload?.iss}`);
      
      if (tokenAud !== env.GOOGLE_CLIENT_ID) {
        console.warn(`[Google Verification Service] WARNING: Audience mismatch!`);
      }
    } else {
      console.warn(`[Google Verification Service] Warning: jwt.decode returned null`);
    }
  } catch (err) {
    console.error(`[Google Verification Service] Error decoding token:`, err);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Invalid Google token payload");
  }
  return {
    email: payload.email,
    name: payload.name || payload.given_name || "Google User",
    picture: payload.picture,
    googleId: payload.sub,
  };
}

export async function authenticateGoogleUser(token: string): Promise<any> {
  const googleUser = await verifyGoogleToken(token);
  if (!googleUser.email) {
    return { success: false, statusCode: 400, msg: "Google account does not provide an email" };
  }

  let user = await prisma.user.findUnique({
    where: {
      email: googleUser.email,
    },
  });

  if (user) {
    // Link Google account details if not already linked
    if (!user.googleId || !user.avatar || user.provider !== "GOOGLE") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleUser.googleId,
          avatar: user.avatar || googleUser.picture,
          provider: "GOOGLE",
        },
      });
    }
  } else {
    // Create new user with provider=GOOGLE
    const baseUsername = googleUser.email.split("@")[0] || "googleuser";
    let username = baseUsername;
    let count = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${count}`;
      count++;
    }

    user = await prisma.user.create({
      data: {
        email: googleUser.email,
        username,
        provider: "GOOGLE",
        googleId: googleUser.googleId,
        avatar: googleUser.picture,
      },
    });
  }

  const appToken = jwt.sign(
    {
      userId: user.id,
    },
    env.JWT_SECRET,
  );

  return {
    success: true,
    token: appToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      provider: user.provider,
    },
  };
}
