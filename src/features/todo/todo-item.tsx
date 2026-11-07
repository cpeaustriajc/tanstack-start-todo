import { Option } from "effect";

import { Checkbox } from "#/components/ui/checkbox.tsx";
import type { Todo } from "#/domain/todo.ts";
import { CompletionState } from "#/features/todo/completion-model.ts";
import { RetryAlert } from "#/features/todo/retry-alert.tsx";
import { useCompletion } from "#/features/todo/todo-provider.tsx";

type Props = Readonly<{ todo: Todo }>;

export const TodoItem = ({ todo }: Props) => {
  const { completion, complete, retry } = useCompletion(todo.id);
  const isDone = Option.isSome(todo.doneAt);
  const isChecked = isDone || CompletionState.$is("Completing")(completion);
  const canComplete = !isDone && CompletionState.$is("Idle")(completion);
  const hasFailed = CompletionState.$is("CompleteFailed")(completion);

  return (
    <li className="flex flex-col gap-1">
      <Checkbox isDisabled={!canComplete} isSelected={isChecked} onChange={complete}>
        {todo.title}
      </Checkbox>
      {hasFailed && <RetryAlert onRetry={retry}>Could not complete the todo.</RetryAlert>}
    </li>
  );
};
