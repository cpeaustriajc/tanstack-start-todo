import { CompletionEvent, CompletionState } from "#/features/todo/completion-model.ts";
import { TodoEvent, completionOf } from "#/features/todo/todo-model.ts";
import { useTodoDispatch, useTodoState } from "#/features/todo/todo-provider.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Checkbox } from "#/components/ui/checkbox.tsx";
import { Option } from "effect";
import type { ReactElement } from "react";
import type { Todo } from "#/domain/todo.ts";
import { useCallback } from "react";

type Props = Readonly<{ todo: Todo }>;

const FAILED_MESSAGE = "Could not complete the todo.";
const RETRY_TEXT = "Retry";

const TodoItem = ({ todo }: Props): ReactElement => {
  const dispatch = useTodoDispatch();
  const state = useTodoState();
  const completion = completionOf({ id: todo.id, state });
  const isDone = Option.isSome(todo.doneAt);
  const isCompleting = CompletionState.$is("Completing")(completion);
  const complete = useCallback(() => {
    dispatch(TodoEvent.Completion({ event: CompletionEvent.Complete(), id: todo.id }));
  }, [dispatch, todo.id]);
  const retry = useCallback(() => {
    dispatch(TodoEvent.Completion({ event: CompletionEvent.Retry(), id: todo.id }));
  }, [dispatch, todo.id]);

  return (
    <li className="flex flex-col gap-1">
      <Checkbox
        isDisabled={isDone || !CompletionState.$is("Idle")(completion)}
        isSelected={isDone || isCompleting}
        onChange={complete}
      >
        {todo.title}
      </Checkbox>
      {CompletionState.$is("CompleteFailed")(completion) && (
        <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
          {FAILED_MESSAGE}
          <Button onPress={retry} size="sm" variant="outline">
            {RETRY_TEXT}
          </Button>
        </p>
      )}
    </li>
  );
};

export { TodoItem };
