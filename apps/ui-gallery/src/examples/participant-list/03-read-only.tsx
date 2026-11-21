import { ParticipantList } from "@forgeron/ui";

export default function ReadOnly() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <ParticipantList
        label="Reviewers"
        ordered={false}
        value={[
          { id: "a", name: "Léa Martin", role: "Reviewer", status: "approved" },
          { id: "b", name: "Karim Aziz", role: "Reviewer", status: "rejected" },
          { id: "c", name: "Jo Bernard", role: "Reviewer", status: "skipped" },
        ]}
      />
    </div>
  );
}
