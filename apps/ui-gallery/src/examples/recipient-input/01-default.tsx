import {
  RecipientFields,
  RecipientFieldsInput,
  RecipientFieldsRow,
  RecipientFieldsToggles,
  RecipientInput,
  RecipientInputBox,
  RecipientInputField,
  RecipientInputLabel,
  RecipientInputStatus,
  RecipientInputSuggestions,
  type ConversationContact,
} from "@forgeron/ui";

const contacts: ConversationContact[] = [
  { id: "1", name: "Léa Martin", email: "lea@acme.io" },
  { id: "2", name: "Karim Aziz", email: "karim@acme.io" },
  { id: "g", name: "Finance team", members: ["karim@acme.io", "jo@partner.fr"] },
];

export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 16 }}>
      <RecipientFields contacts={contacts} defaultValue={{ to: ["lea@acme.io"], cc: [], bcc: [] }}>
        <RecipientFieldsRow>
          <RecipientFieldsInput name="to" />
          <RecipientFieldsToggles />
        </RecipientFieldsRow>
        <RecipientFieldsInput name="cc" />
        <RecipientFieldsInput name="bcc" />
      </RecipientFields>
      <RecipientInput label="Reply to" contacts={contacts} max={1}>
        <RecipientInputLabel />
        <RecipientInputField>
          <RecipientInputBox />
          <RecipientInputSuggestions />
        </RecipientInputField>
        <RecipientInputStatus />
      </RecipientInput>
    </div>
  );
}
