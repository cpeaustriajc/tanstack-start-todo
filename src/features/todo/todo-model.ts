import type { AddingCommand, AddingEvent } from "#/features/todo/adding-model.ts";
import { AddingState, transitionAdding } from "#/features/todo/adding-model.ts";
import type { CompletionCommand, CompletionEvent } from "#/features/todo/completion-model.ts";
import { CompletionState, transitionCompletion } from "#/features/todo/completion-model.ts";
import { Data, Match, Option } from "effect";
import type { TodoId } from "#/domain/todo-id.ts";

type Id = typeof TodoId.Type;

type TodoState = Readonly<{
  adding: AddingState;
  completions: Readonly<Record<Id, CompletionState>>;
}>;
type TodoEvent = Data.TaggedEnum<{
  Adding: { readonly event: AddingEvent };
  Completion: { readonly event: CompletionEvent; readonly id: Id };
}>;
type TodoCommand = AddingCommand | CompletionCommand;
type TodoStep = readonly [TodoState, Option.Option<TodoCommand>];

const TodoEvent = Data.taggedEnum<TodoEvent>();

const initialTodoState: TodoState = { adding: AddingState.Editing(), completions: {} };

const completionOf = ({ id, state }: Readonly<{ id: Id; state: TodoState }>): CompletionState =>
  Option.getOrElse(Option.fromNullishOr(state.completions[id]), () => CompletionState.Idle());

const transitionTodo = ({
  event,
  state,
}: Readonly<{ event: TodoEvent; state: TodoState }>): TodoStep =>
  Match.valueTags(event, {
    Adding: (adding): TodoStep => {
      const [next, command] = transitionAdding({ event: adding.event, state: state.adding });
      return [{ ...state, adding: next }, command];
    },
    Completion: ({ event: completionEvent, id }): TodoStep => {
      const [next, command] = transitionCompletion({
        event: completionEvent,
        id,
        state: completionOf({ id, state }),
      });
      return [{ ...state, completions: { ...state.completions, [id]: next } }, command];
    },
  });

export { TodoEvent, completionOf, initialTodoState, transitionTodo };
export type { TodoCommand, TodoState, TodoStep };
