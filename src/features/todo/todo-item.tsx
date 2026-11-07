import { Option } from "effect";

import { Checkbox } from "#/components/ui/checkbox.tsx";
import type { Todo } from "#/domain/todo.ts";
import { CompletionEvent, CompletionState } from "#/features/todo/completion-model.ts";
import { RetryAlert } from "#/features/todo/retry-alert.tsx";
import { TodoEvent, completionOf } from "#/features/todo/todo-model.ts";
import { useTodoDispatch, useTodoState } from "#/features/todo/todo-provider.tsx";

type Props = Readonly<{ todo: Todo }>;

export const TodoItem = ({ todo }: Props) => {
  const dispatch = useTodoDispatch();
  const completion = completionOf({ id: todo.id, state: useTodoState() });
  const isDone = Option.isSome(todo.doneAt);
  const isIdle = CompletionState.$is("Idle")(completion);
  const isCompleting = CompletionState.$is("Completing")(completion);
  const hasFailed = CompletionState.$is("CompleteFailed")(completion);

  const send = (event: CompletionEvent) => {
    dispatch(TodoEvent.Completion({ id: todo.id, event }));
  };
  const complete = () => {
    send(CompletionEvent.Complete());
  };
  const retry = () => {
    send(CompletionEvent.Retry());
  };

  return (
    <li className="flex flex-col gap-1">
      <Checkbox
        isDisabled={isDone || !isIdle}
        isSelected={isDone || isCompleting}
        onChange={complete}
      >
        {todo.title}
      </Checkbox>
      {hasFailed && <RetryAlert onRetry={retry}>Could not complete the todo.</RetryAlert>}
    </li>
  );
};
