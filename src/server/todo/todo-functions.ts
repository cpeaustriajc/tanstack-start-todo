import { createServerFn } from "@tanstack/react-start";
import { Schema } from "effect";

import { NewTodo, TodoRef } from "#/domain/todo.ts";
import { runtime } from "#/server/runtime.ts";
import { findTodos, insertTodo, markTodoDone } from "#/server/todo/todo-queries.ts";

export const listTodos = createServerFn({ method: "GET" }).handler(() =>
  runtime.runPromise(findTodos()),
);

export const addTodo = createServerFn({ method: "POST" })
  .validator(Schema.toStandardSchemaV1(NewTodo))
  .handler(({ data }) => runtime.runPromise(insertTodo(data)));

export const completeTodo = createServerFn({ method: "POST" })
  .validator(Schema.toStandardSchemaV1(TodoRef))
  .handler(({ data }) => runtime.runPromise(markTodoDone(data)));
