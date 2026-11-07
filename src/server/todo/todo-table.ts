import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  doneAt: text("done_at"),
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
});
