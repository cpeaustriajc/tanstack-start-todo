import { and, eq, isNull } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { createSelectSchema } from "drizzle-orm/effect-schema";
import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { NewTodo, TodoRef } from "#/domain/todo.ts";
import { Todo } from "#/domain/todo.ts";
import { Database } from "#/server/db/database.ts";
import { todos } from "#/server/todo/todo-table.ts";

export type TodoError = EffectDrizzleQueryError | Schema.SchemaError;

interface TodoRepositoryShape {
  readonly list: Effect.Effect<readonly Todo[], TodoError>;
  readonly add: (todo: NewTodo) => Effect.Effect<Todo, TodoError>;
  readonly complete: (ref: TodoRef) => Effect.Effect<void, EffectDrizzleQueryError>;
}

const TodoRow = createSelectSchema(todos);
const toTodo = Schema.decodeUnknownEffect(TodoRow.pipe(Schema.decodeTo(Todo)));

const makeTodoRepository = Effect.gen(function* () {
  const db = yield* Database;
  const repository: TodoRepositoryShape = {
    list: db
      .select()
      .from(todos)
      .orderBy(todos.id)
      .pipe(Effect.flatMap((rows) => Effect.forEach(rows, (row) => toTodo(row)))),
    add: ({ title }) =>
      db
        .insert(todos)
        .values({ title })
        .returning()
        .pipe(Effect.flatMap(([row]) => toTodo(row))),
    complete: ({ id }) =>
      DateTime.now.pipe(
        Effect.flatMap((now) =>
          db
            .update(todos)
            .set({ doneAt: DateTime.formatIso(now) })
            .where(and(eq(todos.id, id), isNull(todos.doneAt))),
        ),
        Effect.asVoid,
      ),
  };
  return repository;
});

export class TodoRepository extends Context.Service<TodoRepository, TodoRepositoryShape>()(
  "todo/server/todo/todo-repository/TodoRepository",
) {
  public static readonly layer = Layer.effect(TodoRepository, makeTodoRepository);
}
