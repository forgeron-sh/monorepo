import { FileDetails } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 320 }}>
      <FileDetails
        name="Dock plan.pdf"
        size={240_000}
        owner="Léa Martin"
        location="Operations › Lyon depot"
        modified="Nov 18, 2026 · 09:12"
        created="Oct 3, 2026 · 10:40"
        access={{
          people: ["Léa Martin", "Tom Garnier", "Camille Roy"],
          scope: "organization",
          summary: "Anyone at Atelier Moreau can view",
          onManage: () => {},
        }}
      />
    </div>
  );
}
