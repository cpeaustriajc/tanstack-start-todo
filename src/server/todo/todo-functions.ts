import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { NewTodo, TodoRef } from "#/domain/todo.ts";
import { runtime } from "#/server/runtime.ts";
import { TodoRepository } from "#/server/todo/todo-repository.ts";

export const listTodos = createServerFn({ method: "GET" }).handler(() =>
  runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* TodoRepository;
      return yield* repository.list;
    }),
  ),
);

export const addTodo = createServerFn({ method: "POST" })
  .validator(Schema.toStandardSchemaV1(NewTodo))
  .handler(({ data }) =>
    runtime.runPromise(
      Effect.gen(function* () {
        const repository = yield* TodoRepository;
        return yield* repository.add(data);
      }),
    ),
  );

export const completeTodo = createServerFn({ method: "POST" })
  .validator(Schema.toStandardSchemaV1(TodoRef))
  .handler(({ data }) =>
    runtime.runPromise(
      Effect.gen(function* () {
        const repository = yield* TodoRepository;
        yield* repository.complete(data);
      }),
    ),
  );
