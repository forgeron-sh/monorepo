import { Field, Input } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 20, width: 320 }}>
      <Field label="Workspace name" hint="Shown to everyone you invite.">
        {(control) => <Input {...control} defaultValue="Atelier Moreau" />}
      </Field>
      <Field label="Subdomain" error="This name is taken. Try another one.">
        {(control) => <Input {...control} mono defaultValue="atelier" />}
      </Field>
    </div>
  );
}
