import { Data, Match, Option } from "effect";
import type { TodoId } from "#/domain/todo-id.ts";

type Id = typeof TodoId.Type;

type Empty = Record<never, never>;
type CompletionState = Data.TaggedEnum<{
  CompleteFailed: Empty;
  Completing: Empty;
  Idle: Empty;
}>;
type CompletionEvent = Data.TaggedEnum<{
  Complete: Empty;
  CompleteFailed: Empty;
  Completed: Empty;
  Retry: Empty;
}>;
type CompletionCommand = Data.TaggedEnum<{
  CompleteTodo: { readonly id: Id };
  InvalidateLoader: Empty;
}>;
type CompletionStep = readonly [CompletionState, Option.Option<CompletionCommand>];

const CompletionState = Data.taggedEnum<CompletionState>();
const CompletionEvent = Data.taggedEnum<CompletionEvent>();
const CompletionCommand = Data.taggedEnum<CompletionCommand>();

const stay = (state: CompletionState): CompletionStep => [state, Option.none()];
const completeTodo = (id: Id): CompletionStep => [
  CompletionState.Completing(),
  Option.some(CompletionCommand.CompleteTodo({ id })),
];

const transitionCompletion = ({
  event,
  id,
  state,
}: Readonly<{ event: CompletionEvent; id: Id; state: CompletionState }>): CompletionStep =>
  Match.valueTags(state, {
    CompleteFailed: (failed) =>
      Match.valueTags(event, {
        Complete: () => stay(failed),
        CompleteFailed: () => stay(failed),
        Completed: () => stay(failed),
        Retry: () => completeTodo(id),
      }),
    Completing: (completing) =>
      Match.valueTags(event, {
        Complete: () => stay(completing),
        CompleteFailed: () => stay(CompletionState.CompleteFailed()),
        Completed: (): CompletionStep => [
          CompletionState.Idle(),
          Option.some(CompletionCommand.InvalidateLoader()),
        ],
        Retry: () => stay(completing),
      }),
    Idle: (idle) =>
      Match.valueTags(event, {
        Complete: () => completeTodo(id),
        CompleteFailed: () => stay(idle),
        Completed: () => stay(idle),
        Retry: () => stay(idle),
      }),
  });

export { CompletionCommand, CompletionEvent, CompletionState, transitionCompletion };
