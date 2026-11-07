import { Schema } from "effect";

export const TodoId = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(1)),
  Schema.brand("TodoId"),
);
