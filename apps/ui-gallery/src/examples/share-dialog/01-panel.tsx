import { SharePanel } from "@forgeron/ui";

const directory = [
  { id: "hb", name: "Hugo Bernard", hint: "Engineering" },
  { id: "np", name: "Nadia Petit", hint: "Finance" },
  { id: "tg", name: "Tom Garnier", hint: "Support" },
  { id: "team-ops", name: "Operations team", hint: "2 people" },
];

export default function Panel() {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <SharePanel
        directory={directory}
        organization="Atelier Moreau"
        inherited={[{ person: { id: "cr", name: "Camille Roy", hint: "Sales" }, role: "Owner" }]}
        defaultValue={{
          people: [{ id: "np", role: "commenter" }],
          general: "organization",
          generalRole: "viewer",
          link: { expires: "never", password: false, download: true },
        }}
      />
    </div>
  );
}
