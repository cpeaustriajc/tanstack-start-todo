import { Effect, Function, Match, Option } from "effect";
import type { ReactElement, ReactNode } from "react";
import type { TodoCommand, TodoState, TodoStep } from "#/features/todo/todo-model.ts";
import { TodoEvent, initialTodoState, transitionTodo } from "#/features/todo/todo-model.ts";
import { addTodo, completeTodo } from "#/server/todo/todo-functions.ts";
import { createContext, use, useEffect, useReducer } from "react";
import { AddingEvent } from "#/features/todo/adding-model.ts";
import { CompletionEvent } from "#/features/todo/completion-model.ts";
import { useRouter } from "@tanstack/react-router";

type Dispatch = (event: TodoEvent) => void;
type Props = Readonly<{ children: ReactNode }>;

const TodoStateContext = createContext<TodoState>(initialTodoState);
const TodoDispatchContext = createContext<Dispatch>(Function.constVoid);

const initialStep: TodoStep = [initialTodoState, Option.none()];
const step = ([state]: TodoStep, event: TodoEvent): TodoStep => transitionTodo({ event, state });

const runCommand = (
  command: TodoCommand,
  dispatch: Dispatch,
  invalidate: () => Promise<void>,
): Effect.Effect<void> =>
  Match.valueTags(command, {
    CompleteTodo: ({ id }) =>
      Effect.tryPromise({
        catch: () => CompletionEvent.CompleteFailed(),
        try: () => completeTodo({ data: { id } }),
      }).pipe(
        Effect.match({
          onFailure: Function.identity,
          onSuccess: () => CompletionEvent.Completed(),
        }),
        Effect.flatMap((event) =>
          Effect.sync(() => {
            dispatch(TodoEvent.Completion({ event, id }));
          }),
        ),
      ),
    InvalidateLoader: () => Effect.promise(invalidate),
    SaveTodo: ({ todo }) =>
      Effect.tryPromise({
        catch: () => AddingEvent.SaveFailed(),
        try: () => addTodo({ data: todo }),
      }).pipe(
        Effect.match({ onFailure: Function.identity, onSuccess: () => AddingEvent.Saved() }),
        Effect.flatMap((event) =>
          Effect.sync(() => {
            dispatch(TodoEvent.Adding({ event }));
          }),
        ),
      ),
  });

const TodoProvider = ({ children }: Props): ReactElement => {
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

const useTodoState = (): TodoState => use(TodoStateContext);
const useTodoDispatch = (): Dispatch => use(TodoDispatchContext);

export { TodoProvider, useTodoDispatch, useTodoState };
