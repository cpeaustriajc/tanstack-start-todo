import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  out: "./src/server/db/migrations",
  schema: "./src/server/*/*-table.ts",
});
