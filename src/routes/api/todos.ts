import { createFileRoute } from "@tanstack/react-router";
import { Effect, Schema } from "effect";

import { NewTodo, Todo, TodoList } from "#/domain/todo.ts";
import { runtime } from "#/server/runtime.ts";
import { TodoRepository } from "#/server/todo/todo-repository.ts";

export const Route = createFileRoute("/api/todos")({
  server: {
    handlers: {
      GET: () => runtime.runPromise(listResponse),
      POST: ({ request }) =>
        runtime.runPromise(
          Effect.promise(() => request.text()).pipe(
            Effect.flatMap(decodeNewTodo),
            Effect.matchEffect({ onSuccess: addResponse, onFailure: badRequest }),
          ),
        ),
    },
  },
});

const listResponse = Effect.gen(function* () {
  const todos = yield* TodoRepository;
  const all = yield* todos.list;
  const body = yield* Schema.encodeEffect(TodoList)(all);
  return Response.json(body);
});

const addResponse = (todo: NewTodo) =>
  Effect.gen(function* () {
    const todos = yield* TodoRepository;
    const added = yield* todos.add(todo);
    const body = yield* Schema.encodeEffect(Todo)(added);
    return Response.json(body, { status: 201 });
  });

const badRequest = ({ message }: Readonly<{ message: string }>) =>
  Effect.succeed(Response.json({ error: message }, { status: 400 }));

const decodeNewTodo = Schema.decodeEffect(Schema.fromJsonString(NewTodo));
