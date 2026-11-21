import { RecipientFields, type ConversationContact } from "@forgeron/ui";

const contacts: ConversationContact[] = [
  { id: "1", name: "Léa Martin", email: "lea@acme.io" },
  { id: "2", name: "Karim Aziz", email: "karim@acme.io" },
  { id: "3", name: "Jo Bernard", email: "jo@partner.fr" },
  { id: "g", name: "Finance team", members: ["karim@acme.io", "jo@partner.fr", "compta@acme.io"] },
];

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <RecipientFields
        contacts={contacts}
        defaultValue={{ to: ["lea@acme.io", "oops@"], cc: [], bcc: [] }}
      />
    </div>
  );
}
