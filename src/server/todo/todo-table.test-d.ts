import { expectTypeOf } from "vitest";

import type { Todo } from "#/domain/todo.ts";
import type { todoTable } from "#/server/todo/todo-table.ts";

expectTypeOf<Readonly<typeof todoTable.$inferSelect>>().toEqualTypeOf<typeof Todo.Encoded>();
