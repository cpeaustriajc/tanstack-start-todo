import { AddingEvent, AddingState } from "#/features/todo/adding-model.ts";
import { Option, Predicate } from "effect";
import type { ReactElement, SyntheticEvent } from "react";
import { useTodoDispatch, useTodoState } from "#/features/todo/todo-provider.tsx";
import { AddTodoFailed } from "#/features/todo/add-todo-failed.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Form } from "#/components/ui/form.tsx";
import { TextField } from "#/components/ui/text-field.tsx";
import { TodoEvent } from "#/features/todo/todo-model.ts";

const NEW_TODO_LABEL = "New todo";
const NEW_TODO_PLACEHOLDER = "What needs doing?";
const ADD_TEXT = "Add";
const TITLE_FIELD = "title";

const AddTodoForm = (): ReactElement => {
  const dispatch = useTodoDispatch();
  const state = useTodoState();
  const isEditing = AddingState.$is("Editing")(state.adding);
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const field = new FormData(event.currentTarget).get(TITLE_FIELD);
    const title = Option.getOrElse(Option.liftPredicate(field, Predicate.isString), () => "");
    dispatch(TodoEvent.Adding({ event: AddingEvent.Submit({ title }) }));
  };
  const retry = (): void => {
    dispatch(TodoEvent.Adding({ event: AddingEvent.Retry() }));
  };

  return (
    <Form onSubmit={submit}>
      <div className="flex gap-2">
        <TextField
          aria-label={NEW_TODO_LABEL}
          isDisabled={!isEditing}
          name={TITLE_FIELD}
          placeholder={NEW_TODO_PLACEHOLDER}
        />
        <Button isDisabled={!isEditing} type="submit">
          {ADD_TEXT}
        </Button>
      </div>
      {AddingState.$is("AddFailed")(state.adding) && <AddTodoFailed onRetry={retry} />}
    </Form>
  );
};

export { AddTodoForm };
