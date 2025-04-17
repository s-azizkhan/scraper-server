import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  migrations: {
    prefix: "supabase",
    schema: "public",
  },
  out: "./src/drizzle/migrations",
});