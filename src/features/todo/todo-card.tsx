import { CardContent } from "#/components/ui/card-content.tsx";
import { CardHeader } from "#/components/ui/card-header.tsx";
import { CardTitle } from "#/components/ui/card-title.tsx";
import { Card } from "#/components/ui/card.tsx";
import type { Todo } from "#/domain/todo.ts";
import { AddTodoForm } from "#/features/todo/add-todo-form.tsx";
import { TodoList } from "#/features/todo/todo-list.tsx";

type Props = Readonly<{ todos: readonly Todo[] }>;

export const TodoCard = ({ todos }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>Todos</CardTitle>
    </CardHeader>
    <CardContent>
      <AddTodoForm />
      <TodoList todos={todos} />
    </CardContent>
  </Card>
);
