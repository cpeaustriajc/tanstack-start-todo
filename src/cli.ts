#!/usr/bin/env node
import { Console, Effect, ManagedRuntime, Option, Schema } from "effect";
import { NewTodo, TodoRef } from "#/domain/todo.ts";
import { Command } from "@commander-js/extra-typings";
import type { Todo } from "#/domain/todo.ts";
import type { TodoError } from "#/server/todo/todo-repository.ts";
import { TodoRepository } from "#/server/todo/todo-repository.ts";
import { layer } from "#/server/runtime.ts";

await using runtime = ManagedRuntime.make(layer);

const program = new Command("todo");
const run = <Value>(effect: Effect.Effect<Value, TodoError, TodoRepository>): Promise<Value> =>
  runtime.runPromise(
    effect.pipe(
      Effect.catchTag("SchemaError", ({ message }) => Effect.sync(() => program.error(message))),
    ),
  );
const mark = (todo: Todo): string =>
  Option.match(todo.doneAt, { onNone: () => "[ ]", onSome: () => "[x]" });
const runAdd = (title: string): Promise<void> =>
  run(
    Effect.gen(function* add() {
      const todos = yield* TodoRepository;
      const newTodo = yield* Schema.decodeEffect(NewTodo)({ title });
      const todo = yield* todos.add(newTodo);
      yield* Console.log(`added #${todo.id}`);
    }),
  );
const runList = (): Promise<void> =>
  run(
    Effect.gen(function* list() {
      const todos = yield* TodoRepository;
      for (const todo of yield* todos.list) {
        yield* Console.log(`${mark(todo)} #${todo.id} ${todo.title}`);
      }
    }),
  );
const runDone = (id: string): Promise<void> =>
  run(
    Effect.gen(function* done() {
      const todos = yield* TodoRepository;
      const ref = yield* Schema.decodeEffect(TodoRef)({ id: Number(id) });
      yield* todos.complete(ref);
    }),
  );

program.command("add").argument("<title>").action(runAdd);
program.command("list").action(runList);
program.command("done").argument("<id>").action(runDone);

await program.parseAsync();
