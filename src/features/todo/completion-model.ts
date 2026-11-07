import { Data, Match, Option } from "effect";

import type { TodoId } from "#/domain/todo-id.ts";

type Empty = Record<never, never>;

export type CompletionState = Data.TaggedEnum<{
  Idle: Empty;
  Completing: Empty;
  CompleteFailed: Empty;
}>;
export type CompletionEvent = Data.TaggedEnum<{
  Complete: Empty;
  Completed: Empty;
  CompletionFailed: Empty;
  Retry: Empty;
}>;
export type CompletionCommand = Data.TaggedEnum<{
  CompleteTodo: { readonly id: TodoId };
  RefreshTodos: Empty;
}>;
type CompletionStep = readonly [CompletionState, Option.Option<CompletionCommand>];

export const CompletionState = Data.taggedEnum<CompletionState>();
export const CompletionEvent = Data.taggedEnum<CompletionEvent>();
export const CompletionCommand = Data.taggedEnum<CompletionCommand>();

export const transitionCompletion = ({
  id,
  state,
  event,
}: Readonly<{ id: TodoId; state: CompletionState; event: CompletionEvent }>): CompletionStep =>
  Match.valueTags(state, {
    Idle: (idle) =>
      Match.valueTags(event, {
        Complete: () => complete(id),
        Completed: () => stay(idle),
        CompletionFailed: () => stay(idle),
        Retry: () => stay(idle),
      }),
    Completing: (completing) =>
      Match.valueTags(event, {
        Complete: () => stay(completing),
        Completed: () => to(CompletionState.Idle(), CompletionCommand.RefreshTodos()),
        CompletionFailed: () => to(CompletionState.CompleteFailed()),
        Retry: () => stay(completing),
      }),
    CompleteFailed: (failed) =>
      Match.valueTags(event, {
        Complete: () => stay(failed),
        Completed: () => stay(failed),
        CompletionFailed: () => stay(failed),
        Retry: () => complete(id),
      }),
  });

const complete = (id: TodoId) =>
  to(CompletionState.Completing(), CompletionCommand.CompleteTodo({ id }));

const stay = (state: CompletionState): CompletionStep => [state, Option.none()];

const to = (state: CompletionState, command?: CompletionCommand): CompletionStep => [
  state,
  Option.fromUndefinedOr(command),
];
