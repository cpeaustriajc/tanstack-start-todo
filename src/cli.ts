#!/usr/bin/env node
import { Command } from "@commander-js/extra-typings";
import { Console, Effect, ManagedRuntime, Option, Schema } from "effect";

import { NewTodo, TodoRef } from "#/domain/todo.ts";
import type { Todo } from "#/domain/todo.ts";
import { Database } from "#/server/db/database.ts";
import type { TodoQueryError } from "#/server/todo/todo-queries.ts";
import { findTodos, insertTodo, markTodoDone } from "#/server/todo/todo-queries.ts";

await using runtime = ManagedRuntime.make(Database.layer);

const program = new Command("todo");

const run = <Value>(effect: Effect.Effect<Value, TodoQueryError, Database>) =>
  runtime.runPromise(
    effect.pipe(
      Effect.catchTag("SchemaError", ({ message }) => Effect.sync(() => program.error(message))),
    ),
  );

const checkboxOf = (todo: Todo) => (Option.isSome(todo.doneAt) ? "[x]" : "[ ]");

const runAdd = (title: string) =>
  run(
    Effect.gen(function* () {
      const newTodo = yield* Schema.decodeEffect(NewTodo)({ title });
      const todo = yield* insertTodo(newTodo);
      yield* Console.log(`added #${todo.id}`);
    }),
  );

const runList = () =>
  run(
    Effect.gen(function* () {
      const todos = yield* findTodos();
      for (const todo of todos) {
        yield* Console.log(`${checkboxOf(todo)} #${todo.id} ${todo.title}`);
      }
    }),
  );

const runDone = (id: string) =>
  run(
    Effect.gen(function* () {
      const ref = yield* Schema.decodeEffect(TodoRef)({ id: Number(id) });
      yield* markTodoDone(ref);
    }),
  );

program.command("add").argument("<title>").action(runAdd);
program.command("list").action(runList);
program.command("done").argument("<id>").action(runDone);

await program.parseAsync();
