import { expectTypeOf } from "vitest";

import type { Todo } from "#/domain/todo.ts";
import type { todos } from "#/server/todo/todo-table.ts";

expectTypeOf<Readonly<typeof todos.$inferSelect>>().toEqualTypeOf<typeof Todo.Encoded>();
