import { Context, DateTime, Effect, Layer, Schema } from "effect";
import type { NewTodo, TodoRef } from "#/domain/todo.ts";
import { and, eq, isNull } from "drizzle-orm";
import { Database } from "#/server/db/database.ts";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Todo } from "#/domain/todo.ts";
import { createSelectSchema } from "drizzle-orm/effect-schema";
import { todos } from "#/server/todo/todo-table.ts";

type TodoError = EffectDrizzleQueryError | Schema.SchemaError;

interface TodoRepositoryShape {
  readonly add: (todo: NewTodo) => Effect.Effect<Todo, TodoError>;
  readonly complete: (ref: TodoRef) => Effect.Effect<void, EffectDrizzleQueryError>;
  readonly list: Effect.Effect<readonly Todo[], TodoError>;
}

const TodoRow = createSelectSchema(todos);
const toTodo = Schema.decodeUnknownEffect(TodoRow.pipe(Schema.decodeTo(Todo)));

const makeTodoRepository = Effect.gen(function* makeTodoRepository() {
  const db = yield* Database;
  const repository: TodoRepositoryShape = {
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
    list: db
      .select()
      .from(todos)
      .orderBy(todos.id)
      .pipe(Effect.flatMap((rows) => Effect.forEach(rows, (row) => toTodo(row)))),
  };
  return repository;
});

class TodoRepository extends Context.Service<TodoRepository, TodoRepositoryShape>()(
  "todo/server/todo/todo-repository/TodoRepository",
) {
  public static readonly layer = Layer.effect(TodoRepository, makeTodoRepository);
}

export { TodoRepository };
export type { TodoError };
