import { useRouter } from "@tanstack/react-router";
import { Effect, Function, Match, Option } from "effect";
import type { ReactNode, SyntheticEvent } from "react";
import { createContext, use, useEffect, useReducer } from "react";

import type { TodoId } from "#/domain/todo-id.ts";
import { AddingEvent } from "#/features/todo/adding-model.ts";
import { CompletionEvent } from "#/features/todo/completion-model.ts";
import { RequestFailed } from "#/features/todo/request-failed-error.ts";
import type { TodoCommand, TodoState, TodoStep } from "#/features/todo/todo-model.ts";
import {
  TodoEvent,
  completionOf,
  initialTodoState,
  transitionTodo,
} from "#/features/todo/todo-model.ts";
import { addTodo, completeTodo } from "#/server/todo/todo-functions.ts";

type Dispatch = (event: TodoEvent) => void;
type Props = Readonly<{ children: ReactNode }>;

export const TodoProvider = ({ children }: Props) => {
  const router = useRouter();
  const [[state, command], dispatch] = useReducer(step, initialStep);

  useEffect(() => {
    if (Option.isSome(command)) {
      Effect.runFork(
        runCommand(command.value, { dispatch, refreshTodos: () => router.invalidate() }),
      );
    }
  }, [command, router]);

  return (
    <TodoDispatchContext value={dispatch}>
      <TodoStateContext value={state}>{children}</TodoStateContext>
    </TodoDispatchContext>
  );
};

export const useAdding = () => {
  const dispatch = use(TodoDispatchContext);
  const { adding } = use(TodoStateContext);
  const send = (event: AddingEvent) => {
    dispatch(TodoEvent.Adding({ event }));
  };

  return {
    adding,
    edit: (title: string) => {
      send(AddingEvent.Edit({ title }));
    },
    submit: (formEvent: SyntheticEvent) => {
      formEvent.preventDefault();
      send(AddingEvent.Submit());
    },
    retry: () => {
      send(AddingEvent.Retry());
    },
  };
};

export const useCompletion = (id: TodoId) => {
  const dispatch = use(TodoDispatchContext);
  const state = use(TodoStateContext);
  const send = (event: CompletionEvent) => {
    dispatch(TodoEvent.Completion({ id, event }));
  };

  return {
    completion: completionOf({ id, state }),
    complete: () => {
      send(CompletionEvent.Complete());
    },
    retry: () => {
      send(CompletionEvent.Retry());
    },
  };
};

const runCommand = (
  command: TodoCommand,
  { dispatch, refreshTodos }: Readonly<{ dispatch: Dispatch; refreshTodos: () => Promise<void> }>,
) =>
  Match.valueTags(command, {
    SaveTodo: ({ todo }) =>
      request(() => addTodo({ data: todo }), {
        succeeded: TodoEvent.Adding({ event: AddingEvent.Saved() }),
        failed: TodoEvent.Adding({ event: AddingEvent.SaveFailed() }),
      }).pipe(Effect.map(dispatch)),
    CompleteTodo: ({ id }) =>
      request(() => completeTodo({ data: { id } }), {
        succeeded: TodoEvent.Completion({ id, event: CompletionEvent.Completed() }),
        failed: TodoEvent.Completion({ id, event: CompletionEvent.CompletionFailed() }),
      }).pipe(Effect.map(dispatch)),
    RefreshTodos: () => Effect.promise(refreshTodos),
  });

const request = <Event,>(
  call: () => Promise<unknown>,
  { succeeded, failed }: Readonly<{ succeeded: Event; failed: Event }>,
) =>
  Effect.tryPromise({ try: call, catch: (cause) => RequestFailed.make({ cause }) }).pipe(
    Effect.as(succeeded),
    Effect.tapError(({ cause }) => Effect.logError("Request failed", cause)),
    Effect.orElseSucceed(() => failed),
  );

const step = ([state]: TodoStep, event: TodoEvent) => transitionTodo({ state, event });
const initialStep: TodoStep = [initialTodoState, Option.none()];

const TodoStateContext = createContext<TodoState>(initialTodoState);
const TodoDispatchContext = createContext<Dispatch>(Function.constVoid);
