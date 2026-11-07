#!/usr/bin/env node
import { Command } from "@commander-js/extra-typings";
import { Console, Effect, ManagedRuntime, Option, Schema } from "effect";

import { NewTodo, TodoRef } from "#/domain/todo.ts";
import type { Todo } from "#/domain/todo.ts";
import { layer } from "#/server/runtime.ts";
import type { TodoError } from "#/server/todo/todo-repository.ts";
import { TodoRepository } from "#/server/todo/todo-repository.ts";

await using runtime = ManagedRuntime.make(layer);

const program = new Command("todo");

const run = <Value>(effect: Effect.Effect<Value, TodoError, TodoRepository>) =>
  runtime.runPromise(
    effect.pipe(
      Effect.catchTag("SchemaError", ({ message }) => Effect.sync(() => program.error(message))),
    ),
  );

const checkboxOf = (todo: Todo) => (Option.isSome(todo.doneAt) ? "[x]" : "[ ]");

const runAdd = (title: string) =>
  run(
    Effect.gen(function* () {
      const repository = yield* TodoRepository;
      const newTodo = yield* Schema.decodeEffect(NewTodo)({ title });
      const todo = yield* repository.add(newTodo);
      yield* Console.log(`added #${todo.id}`);
    }),
  );

const runList = () =>
  run(
    Effect.gen(function* () {
      const repository = yield* TodoRepository;
      const todos = yield* repository.list;
      for (const todo of todos) {
        yield* Console.log(`${checkboxOf(todo)} #${todo.id} ${todo.title}`);
      }
    }),
  );

const runDone = (id: string) =>
  run(
    Effect.gen(function* () {
      const repository = yield* TodoRepository;
      const ref = yield* Schema.decodeEffect(TodoRef)({ id: Number(id) });
      yield* repository.complete(ref);
    }),
  );

program.command("add").argument("<title>").action(runAdd);
program.command("list").action(runList);
program.command("done").argument("<id>").action(runDone);

await program.parseAsync();
