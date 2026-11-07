import { Array } from "effect";

import type { Todo } from "#/domain/todo.ts";
import { TodoItem } from "#/features/todo/todo-item.tsx";

type Props = Readonly<{ todos: readonly Todo[] }>;

export const TodoList = ({ todos }: Props) => (
  <ul className="flex flex-col gap-2">
    {Array.map(todos, (todo) => (
      <TodoItem key={todo.id} todo={todo} />
    ))}
  </ul>
);
