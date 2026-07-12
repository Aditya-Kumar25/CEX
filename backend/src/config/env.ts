import "dotenv/config";

const requiredEnvVars = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "CORS_ORIGIN",
] as const;

const missing: string[] = [];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error(`[Error] Missing required environment variables in backend: ${missing.join(", ")}`);
  process.exit(1);
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  PORT: Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3000),
  CORS_ORIGIN: process.env.CORS_ORIGIN!,
};
export const JWT_SECRET = env.JWT_SECRET;