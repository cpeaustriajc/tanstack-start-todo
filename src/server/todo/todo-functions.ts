import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { NewTodo, TodoRef } from "#/domain/todo.ts";
import { runtime } from "#/server/runtime.ts";
import { TodoRepository } from "#/server/todo/todo-repository.ts";

export const listTodos = createServerFn({ method: "GET" }).handler(() =>
  runtime.runPromise(
    Effect.gen(function* () {
      const todos = yield* TodoRepository;
      return yield* todos.list;
    }),
  ),
);

export const addTodo = createServerFn({ method: "POST" })
  .validator(Schema.toStandardSchemaV1(NewTodo))
  .handler(({ data }) =>
    runtime.runPromise(
      Effect.gen(function* () {
        const todos = yield* TodoRepository;
        return yield* todos.add(data);
      }),
    ),
  );

export const completeTodo = createServerFn({ method: "POST" })
  .validator(Schema.toStandardSchemaV1(TodoRef))
  .handler(({ data }) =>
    runtime.runPromise(
      Effect.gen(function* () {
        const todos = yield* TodoRepository;
        yield* todos.complete(data);
      }),
    ),
  );
