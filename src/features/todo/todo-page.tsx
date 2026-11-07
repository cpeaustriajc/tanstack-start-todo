import type { Todo } from "#/domain/todo.ts";
import { TodoCard } from "#/features/todo/todo-card.tsx";
import { TodoProvider } from "#/features/todo/todo-provider.tsx";

type Props = Readonly<{ todos: readonly Todo[] }>;

export const TodoPage = ({ todos }: Props) => (
  <TodoProvider>
    <main className="mx-auto max-w-md p-6">
      <TodoCard todos={todos} />
    </main>
  </TodoProvider>
);
