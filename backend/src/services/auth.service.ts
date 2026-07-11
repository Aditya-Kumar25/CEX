import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";

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

  const isMatch = await bcrypt.compare(password, exists.password);

  if (!isMatch) {
    return { success: false, isMatch: false };
  }
  const token = jwt.sign(
    {
      userId: exists.id,
    },
    "mysecret",
  );

  return { success: true, isMatch: true, token };
}
