import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Use DIRECT_URL for CLI operations (migrations, db push)
    // Falls back to DATABASE_URL if DIRECT_URL isn't set
    url: env("DIRECT_URL") || env("DATABASE_URL"),
  },
});
