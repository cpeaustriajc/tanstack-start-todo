import { useRouter } from "@tanstack/react-router";
import { Effect, Function, Match, Option } from "effect";
import type { ReactNode } from "react";
import { createContext, use, useEffect, useReducer } from "react";

import { AddingEvent } from "#/features/todo/adding-model.ts";
import { CompletionEvent } from "#/features/todo/completion-model.ts";
import type { TodoCommand, TodoState, TodoStep } from "#/features/todo/todo-model.ts";
import { TodoEvent, initialTodoState, transitionTodo } from "#/features/todo/todo-model.ts";
import { addTodo, completeTodo } from "#/server/todo/todo-functions.ts";

type Dispatch = (event: TodoEvent) => void;
type Props = Readonly<{ children: ReactNode }>;

export const TodoProvider = ({ children }: Props) => {
  const router = useRouter();
  const [[state, command], dispatch] = useReducer(step, initialStep);

  useEffect(() => {
    Option.map(command, (next) =>
      Effect.runFork(runCommand(next, dispatch, () => router.invalidate())),
    );
  }, [command, router]);

  return (
    <TodoDispatchContext value={dispatch}>
      <TodoStateContext value={state}>{children}</TodoStateContext>
    </TodoDispatchContext>
  );
};

export const useTodoState = () => use(TodoStateContext);
export const useTodoDispatch = () => use(TodoDispatchContext);

const runCommand = (command: TodoCommand, dispatch: Dispatch, invalidate: () => Promise<void>) => {
  const send = (event: TodoEvent) =>
    Effect.sync(() => {
      dispatch(event);
    });

  return Match.valueTags(command, {
    SaveTodo: ({ todo }) =>
      Effect.tryPromise({
        try: () => addTodo({ data: todo }),
        catch: () => AddingEvent.SaveFailed(),
      }).pipe(
        Effect.match({ onSuccess: () => AddingEvent.Saved(), onFailure: Function.identity }),
        Effect.flatMap((event) => send(TodoEvent.Adding({ event }))),
      ),
    CompleteTodo: ({ id }) =>
      Effect.tryPromise({
        try: () => completeTodo({ data: { id } }),
        catch: () => CompletionEvent.CompleteFailed(),
      }).pipe(
        Effect.match({
          onSuccess: () => CompletionEvent.Completed(),
          onFailure: Function.identity,
        }),
        Effect.flatMap((event) => send(TodoEvent.Completion({ id, event }))),
      ),
    InvalidateLoader: () => Effect.promise(invalidate),
  });
};

const step = ([state]: TodoStep, event: TodoEvent) => transitionTodo({ state, event });
const initialStep: TodoStep = [initialTodoState, Option.none()];

const TodoStateContext = createContext<TodoState>(initialTodoState);
const TodoDispatchContext = createContext<Dispatch>(Function.constVoid);
