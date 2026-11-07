import { createFileRoute } from "@tanstack/react-router";
import { Effect, Schema } from "effect";

import { NewTodo, Todo, TodoList } from "#/domain/todo.ts";
import { runtime } from "#/server/runtime.ts";
import { findTodos, insertTodo } from "#/server/todo/todo-queries.ts";

export const Route = createFileRoute("/api/todos")({
  server: {
    handlers: {
      GET: () => runtime.runPromise(listResponse),
      POST: ({ request }) =>
        runtime.runPromise(
          Effect.promise(() => request.text()).pipe(
            Effect.flatMap(decodeNewTodo),
            Effect.matchEffect({ onSuccess: addResponse, onFailure: rejectInvalidTodo }),
          ),
        ),
    },
  },
});

const listResponse = Effect.gen(function* () {
  const todos = yield* findTodos();
  const body = yield* Schema.encodeEffect(TodoList)(todos);
  return Response.json(body);
});

const decodeNewTodo = Schema.decodeEffect(Schema.fromJsonString(NewTodo));

const addResponse = (todo: NewTodo) =>
  Effect.gen(function* () {
    const added = yield* insertTodo(todo);
    const body = yield* Schema.encodeEffect(Todo)(added);
    return Response.json(body, { status: 201 });
  });

const rejectInvalidTodo = ({ message }: Readonly<{ message: string }>) =>
  Effect.succeed(Response.json({ error: message }, { status: 400 }));
