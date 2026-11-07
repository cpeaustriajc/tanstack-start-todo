import { and, eq, isNull } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { createSelectSchema } from "drizzle-orm/effect-schema";
import { DateTime, Effect, Schema } from "effect";
import type { Cause } from "effect";
import { SqlSchema } from "effect/sql";

import { NewTodo, Todo, TodoRef } from "#/domain/todo.ts";
import { Database } from "#/server/db/database.ts";
import { todoTable } from "#/server/todo/todo-table.ts";

export type TodoQueryError =
  | EffectDrizzleQueryError
  | Schema.SchemaError
  | Cause.NoSuchElementError;

const TodoFromRow = createSelectSchema(todoTable).pipe(Schema.decodeTo(Todo));

export const findTodos = SqlSchema.findAll({
  Request: Schema.Void,
  Result: TodoFromRow,
  execute: () =>
    Effect.gen(function* () {
      const db = yield* Database;
      return yield* db.select().from(todoTable).orderBy(todoTable.id);
    }),
});

export const insertTodo = SqlSchema.findOne({
  Request: NewTodo,
  Result: TodoFromRow,
  execute: ({ title }) =>
    Effect.gen(function* () {
      const db = yield* Database;
      return yield* db.insert(todoTable).values({ title }).returning();
    }),
});

export const markTodoDone = SqlSchema.void({
  Request: TodoRef,
  execute: ({ id }) =>
    Effect.gen(function* () {
      const db = yield* Database;
      const now = yield* DateTime.now;
      yield* db
        .update(todoTable)
        .set({ doneAt: DateTime.formatIso(now) })
        .where(and(eq(todoTable.id, id), isNull(todoTable.doneAt)));
    }),
});
