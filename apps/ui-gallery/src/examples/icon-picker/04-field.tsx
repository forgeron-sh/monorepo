import { Field, IconPicker } from "@forgeron/ui";

export default function FormField() {
  return (
    <Field label="Folder icon" hint="Shown in the sidebar and the breadcrumb.">
      {(props) => (
        <IconPicker label="Folder icon" variant="field" defaultValue="folder-01" {...props} />
      )}
    </Field>
  );
}
