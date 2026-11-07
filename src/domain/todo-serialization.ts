import { createSerializationAdapter } from "@tanstack/react-router";
import { Effect, Schema } from "effect";

import { Todo } from "#/domain/todo.ts";

export const todoSerialization = createSerializationAdapter({
  key: "todo",
  test: Schema.is(Todo),
  toSerializable: (todo: Todo) => Effect.runSync(Schema.encodeEffect(Todo)(todo)),
  fromSerializable: (encoded: typeof Todo.Encoded) =>
    Effect.runSync(Schema.decodeEffect(Todo)(encoded)),
});
