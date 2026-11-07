import { Schema } from "effect";

import { TodoId } from "#/domain/todo-id.ts";

export class Todo extends Schema.Class<Todo, { readonly brand: unique symbol }>("Todo")({
  id: TodoId,
  title: Schema.NonEmptyString,
  doneAt: Schema.OptionFromNullOr(Schema.DateTimeUtcFromString),
}) {}

export const NewTodo = Schema.Struct({ title: Todo.fields.title });
export const TodoList = Schema.Array(Todo);
export const TodoRef = Schema.Struct({ id: Todo.fields.id });

export type NewTodo = typeof NewTodo.Type;
export type TodoRef = typeof TodoRef.Type;
