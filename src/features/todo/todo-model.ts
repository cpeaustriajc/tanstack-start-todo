import { Data, Match } from "effect";
import type { Option } from "effect";

import type { TodoId } from "#/domain/todo-id.ts";
import type { AddingCommand, AddingEvent } from "#/features/todo/adding-model.ts";
import { AddingState, transitionAdding } from "#/features/todo/adding-model.ts";
import type { CompletionCommand, CompletionEvent } from "#/features/todo/completion-model.ts";
import { CompletionState, transitionCompletion } from "#/features/todo/completion-model.ts";

export type TodoState = Readonly<{
  adding: AddingState;
  completions: Readonly<Record<TodoId, CompletionState>>;
}>;
export type TodoEvent = Data.TaggedEnum<{
  Adding: { readonly event: AddingEvent };
  Completion: { readonly id: TodoId; readonly event: CompletionEvent };
}>;
export type TodoCommand = AddingCommand | CompletionCommand;
export type TodoStep = readonly [TodoState, Option.Option<TodoCommand>];

export const TodoEvent = Data.taggedEnum<TodoEvent>();

export const initialTodoState: TodoState = {
  adding: AddingState.Editing({ title: "" }),
  completions: {},
};

export const transitionTodo = ({
  state,
  event,
}: Readonly<{ state: TodoState; event: TodoEvent }>): TodoStep =>
  Match.valueTags(event, {
    Adding: ({ event: addingEvent }): TodoStep => {
      const [next, command] = transitionAdding({ state: state.adding, event: addingEvent });
      return [{ ...state, adding: next }, command];
    },
    Completion: ({ id, event: completionEvent }): TodoStep => {
      const [next, command] = transitionCompletion({
        id,
        state: completionOf({ id, state }),
        event: completionEvent,
      });
      return [{ ...state, completions: { ...state.completions, [id]: next } }, command];
    },
  });

export const completionOf = ({ id, state }: Readonly<{ id: TodoId; state: TodoState }>) =>
  state.completions[id] ?? CompletionState.Idle();
