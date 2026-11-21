import { Button, Field, Input, Popover } from "@forgeron/ui";

export default function Form() {
  return (
    <Popover
      label="Rename"
      title="Rename"
      description="Shown to everyone in the workspace."
      showClose
      trigger={<Button size="sm">Rename</Button>}
    >
      <Field label="Name">
        {(control) => <Input {...control} defaultValue="Quarterly report" />}
      </Field>
    </Popover>
  );
}
