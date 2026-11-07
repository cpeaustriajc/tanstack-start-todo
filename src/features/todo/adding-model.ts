import { Data, Match, Option, Schema } from "effect";

import { NewTodo } from "#/domain/todo.ts";

type Empty = Record<never, never>;

export type AddingState = Data.TaggedEnum<{
  Editing: { readonly title: string };
  Submitting: { readonly todo: NewTodo };
  AddFailed: { readonly todo: NewTodo };
}>;
export type AddingEvent = Data.TaggedEnum<{
  Edit: { readonly title: string };
  Submit: Empty;
  Saved: Empty;
  SaveFailed: Empty;
  Retry: Empty;
}>;
export type AddingCommand = Data.TaggedEnum<{
  SaveTodo: { readonly todo: NewTodo };
  InvalidateLoader: Empty;
}>;
type AddingStep = readonly [AddingState, Option.Option<AddingCommand>];
type Editing = Data.TaggedEnum.Value<AddingState, "Editing">;

export const AddingState = Data.taggedEnum<AddingState>();
export const AddingEvent = Data.taggedEnum<AddingEvent>();
export const AddingCommand = Data.taggedEnum<AddingCommand>();

export const transitionAdding = ({
  state,
  event,
}: Readonly<{ state: AddingState; event: AddingEvent }>): AddingStep =>
  Match.valueTags(state, {
    Editing: (editing) =>
      Match.valueTags(event, {
        Edit: ({ title }) => stay(AddingState.Editing({ title })),
        Submit: () => submit(editing),
        Saved: () => stay(editing),
        SaveFailed: () => stay(editing),
        Retry: () => stay(editing),
      }),
    Submitting: (submitting) =>
      Match.valueTags(event, {
        Edit: () => stay(submitting),
        Submit: () => stay(submitting),
        Saved: () => enter(AddingState.Editing({ title: "" }), AddingCommand.InvalidateLoader()),
        SaveFailed: () => stay(AddingState.AddFailed({ todo: submitting.todo })),
        Retry: () => stay(submitting),
      }),
    AddFailed: (failed) =>
      Match.valueTags(event, {
        Edit: () => stay(failed),
        Submit: () => stay(failed),
        Saved: () => stay(failed),
        SaveFailed: () => stay(failed),
        Retry: () => save(failed.todo),
      }),
  });

export const titleOf = (state: AddingState) =>
  Match.valueTags(state, {
    Editing: ({ title }) => title,
    Submitting: ({ todo }) => todo.title,
    AddFailed: ({ todo }) => todo.title,
  });

const submit = (editing: Editing) =>
  Option.match(Option.liftPredicate({ title: editing.title }, isNewTodo), {
    onSome: save,
    onNone: () => stay(editing),
  });

const save = (todo: NewTodo) =>
  enter(AddingState.Submitting({ todo }), AddingCommand.SaveTodo({ todo }));

const stay = (state: AddingState): AddingStep => [state, Option.none()];

const enter = (state: AddingState, command: AddingCommand): AddingStep => [
  state,
  Option.some(command),
];

const isNewTodo = Schema.is(NewTodo);
