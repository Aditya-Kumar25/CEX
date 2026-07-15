import { Router } from "express";
import { signup, login, googleAuth } from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/auth/google", googleAuth);

export default router;
