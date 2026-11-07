import { Button } from "#/components/ui/button.tsx";
import { Form } from "#/components/ui/form.tsx";
import { TextField } from "#/components/ui/text-field.tsx";
import { AddingState, titleOf } from "#/features/todo/adding-model.ts";
import { RetryAlert } from "#/features/todo/retry-alert.tsx";
import { useAdding } from "#/features/todo/todo-provider.tsx";

export const AddTodoForm = () => {
  const { adding, edit, submit, retry } = useAdding();
  const isEditing = AddingState.$is("Editing")(adding);
  const hasFailed = AddingState.$is("AddFailed")(adding);

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
