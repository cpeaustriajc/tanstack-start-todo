import { Schema } from "effect";

export type TodoId = typeof TodoId.Type;

export const TodoId = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(1)),
  Schema.brand("TodoId"),
);
