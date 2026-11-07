import { Data, Match, Option } from "effect";

import type { TodoId } from "#/domain/todo-id.ts";

type Id = typeof TodoId.Type;
type Empty = Record<never, never>;

export type CompletionState = Data.TaggedEnum<{
  Idle: Empty;
  Completing: Empty;
  CompleteFailed: Empty;
}>;
export type CompletionEvent = Data.TaggedEnum<{
  Complete: Empty;
  Completed: Empty;
  CompleteFailed: Empty;
  Retry: Empty;
}>;
export type CompletionCommand = Data.TaggedEnum<{
  CompleteTodo: { readonly id: Id };
  InvalidateLoader: Empty;
}>;
type CompletionStep = readonly [CompletionState, Option.Option<CompletionCommand>];

export const CompletionState = Data.taggedEnum<CompletionState>();
export const CompletionEvent = Data.taggedEnum<CompletionEvent>();
export const CompletionCommand = Data.taggedEnum<CompletionCommand>();

export const transitionCompletion = ({
  id,
  state,
  event,
}: Readonly<{ id: Id; state: CompletionState; event: CompletionEvent }>): CompletionStep =>
  Match.valueTags(state, {
    Idle: (idle) =>
      Match.valueTags(event, {
        Complete: () => complete(id),
        Completed: () => stay(idle),
        CompleteFailed: () => stay(idle),
        Retry: () => stay(idle),
      }),
    Completing: (completing) =>
      Match.valueTags(event, {
        Complete: () => stay(completing),
        Completed: () => enter(CompletionState.Idle(), CompletionCommand.InvalidateLoader()),
        CompleteFailed: () => stay(CompletionState.CompleteFailed()),
        Retry: () => stay(completing),
      }),
    CompleteFailed: (failed) =>
      Match.valueTags(event, {
        Complete: () => stay(failed),
        Completed: () => stay(failed),
        CompleteFailed: () => stay(failed),
        Retry: () => complete(id),
      }),
  });

const complete = (id: Id) =>
  enter(CompletionState.Completing(), CompletionCommand.CompleteTodo({ id }));

const stay = (state: CompletionState): CompletionStep => [state, Option.none()];

const enter = (state: CompletionState, command: CompletionCommand): CompletionStep => [
  state,
  Option.some(command),
];
