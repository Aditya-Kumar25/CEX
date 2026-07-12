const requiredEnvVars = ["REDIS_URL"] as const;
const missing: string[] = [];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error(`[Error] Missing required environment variables in Ws: ${missing.join(", ")}`);
  process.exit(1);
}

export const env = {
  REDIS_URL: process.env.REDIS_URL!,
  PORT: Number(process.env.PORT ?? 8080),
};
