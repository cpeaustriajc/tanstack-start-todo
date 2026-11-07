import type { SyntheticEvent } from "react";

import { Button } from "#/components/ui/button.tsx";
import { Form } from "#/components/ui/form.tsx";
import { TextField } from "#/components/ui/text-field.tsx";
import { AddingEvent, AddingState, titleOf } from "#/features/todo/adding-model.ts";
import { RetryAlert } from "#/features/todo/retry-alert.tsx";
import { TodoEvent } from "#/features/todo/todo-model.ts";
import { useTodoDispatch, useTodoState } from "#/features/todo/todo-provider.tsx";

export const AddTodoForm = () => {
  const dispatch = useTodoDispatch();
  const { adding } = useTodoState();
  const isEditing = AddingState.$is("Editing")(adding);
  const hasFailed = AddingState.$is("AddFailed")(adding);

  const send = (event: AddingEvent) => {
    dispatch(TodoEvent.Adding({ event }));
  };
  const edit = (title: string) => {
    send(AddingEvent.Edit({ title }));
  };
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    send(AddingEvent.Submit());
  };
  const retry = () => {
    send(AddingEvent.Retry());
  };

  return (
    <Form onSubmit={submit}>
      <div className="flex gap-2">
        <TextField
          aria-label="New todo"
          isDisabled={!isEditing}
          onChange={edit}
          placeholder="What needs doing?"
          value={titleOf(adding)}
        />
        <Button isDisabled={!isEditing} type="submit">
          Add
        </Button>
      </div>
      {hasFailed && <RetryAlert onRetry={retry}>Could not add the todo.</RetryAlert>}
    </Form>
  );
};
