import type { ReactElement } from "react";
import type { Todo } from "#/domain/todo.ts";
import { TodoCard } from "#/features/todo/todo-card.tsx";
import { TodoProvider } from "#/features/todo/todo-provider.tsx";

type Props = Readonly<{ todos: readonly Todo[] }>;

const TodoPage = ({ todos }: Props): ReactElement => (
  <TodoProvider>
    <main className="mx-auto max-w-md p-6">
      <TodoCard todos={todos} />
    </main>
  </TodoProvider>
);

export { TodoPage };
