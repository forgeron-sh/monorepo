import { ParticipantList } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <ParticipantList
        label="Signers"
        editable
        colors
        defaultValue={[
          {
            id: "a",
            name: "Léa Martin",
            role: "Client",
            email: "lea@acme.test",
            status: "approved",
            at: "2026-11-18T10:00:00Z",
          },
          {
            id: "b",
            name: "Karim Aziz",
            role: "Witness",
            email: "karim@acme.test",
            status: "current",
          },
          {
            id: "c",
            name: "Jo Bernard",
            role: "Provider",
            email: "jo@acme.test",
            status: "waiting",
          },
        ]}
        onRemind={() => {}}
      />
    </div>
  );
}
