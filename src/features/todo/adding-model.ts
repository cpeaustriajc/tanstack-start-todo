import { Data, Match, Option, Schema } from "effect";
import { NewTodo } from "#/domain/todo.ts";

type Empty = Record<never, never>;
type AddingState = Data.TaggedEnum<{
  AddFailed: { readonly todo: NewTodo };
  Editing: Empty;
  Submitting: { readonly todo: NewTodo };
}>;
type AddingEvent = Data.TaggedEnum<{
  Retry: Empty;
  SaveFailed: Empty;
  Saved: Empty;
  Submit: { readonly title: string };
}>;
type AddingCommand = Data.TaggedEnum<{
  InvalidateLoader: Empty;
  SaveTodo: { readonly todo: NewTodo };
}>;
type AddingStep = readonly [AddingState, Option.Option<AddingCommand>];

const AddingState = Data.taggedEnum<AddingState>();
const AddingEvent = Data.taggedEnum<AddingEvent>();
const AddingCommand = Data.taggedEnum<AddingCommand>();

const hasTitle = Schema.is(NewTodo);
const stay = (state: AddingState): AddingStep => [state, Option.none()];
const saveTodo = (todo: NewTodo): AddingStep => [
  AddingState.Submitting({ todo }),
  Option.some(AddingCommand.SaveTodo({ todo })),
];
const submit = (editing: AddingState, title: string): AddingStep =>
  Option.match(Option.liftPredicate({ title }, hasTitle), {
    onNone: () => stay(editing),
    onSome: saveTodo,
  });

const transitionAdding = ({
  event,
  state,
}: Readonly<{ event: AddingEvent; state: AddingState }>): AddingStep =>
  Match.valueTags(state, {
    AddFailed: (failed) =>
      Match.valueTags(event, {
        Retry: () => saveTodo(failed.todo),
        SaveFailed: () => stay(failed),
        Saved: () => stay(failed),
        Submit: () => stay(failed),
      }),
    Editing: (editing) =>
      Match.valueTags(event, {
        Retry: () => stay(editing),
        SaveFailed: () => stay(editing),
        Saved: () => stay(editing),
        Submit: ({ title }) => submit(editing, title),
      }),
    Submitting: (submitting) =>
      Match.valueTags(event, {
        Retry: () => stay(submitting),
        SaveFailed: () => stay(AddingState.AddFailed({ todo: submitting.todo })),
        Saved: (): AddingStep => [
          AddingState.Editing(),
          Option.some(AddingCommand.InvalidateLoader()),
        ],
        Submit: () => stay(submitting),
      }),
  });

export { AddingCommand, AddingEvent, AddingState, transitionAdding };
