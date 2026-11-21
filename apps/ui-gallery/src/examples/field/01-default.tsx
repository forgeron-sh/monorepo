import { Field, Input } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 320 }}>
      <Field label="Workspace name" hint="Shown to everyone you invite.">
        {(control) => <Input {...control} defaultValue="Atelier Moreau" />}
      </Field>
    </div>
  );
}
