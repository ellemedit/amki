import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: (process.env.SUPA_POSTGRES_URL ?? process.env.DATABASE_URL)!,
  },
});
