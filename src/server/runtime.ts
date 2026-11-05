import { Layer, ManagedRuntime } from "effect";
import { Database } from "#/server/db/database.ts";
import { TodoRepository } from "#/server/todo/todo-repository.ts";

const layer = TodoRepository.layer.pipe(Layer.provide(Database.layer));
const runtime = ManagedRuntime.make(layer);

export { layer, runtime };
