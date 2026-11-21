// The modal: add people with the arrows and Enter, open the file to anyone with the link and set
// the link's expiry, password and download. Done hands back the settings.
import { Button, DEFAULT_SHARE, ShareDialog, type ShareSettings } from "@forgeron/ui";
import { useState } from "react";

const directory = [
  { id: "hb", name: "Hugo Bernard", hint: "Engineering" },
  { id: "lm", name: "Léa Martin", hint: "Engineering, Operations" },
  { id: "np", name: "Nadia Petit", hint: "Finance" },
  { id: "tg", name: "Tom Garnier", hint: "Support" },
  { id: "team-sales", name: "Sales team", hint: "1 person" },
];

export default function DialogExample() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<ShareSettings>({
    ...DEFAULT_SHARE,
    general: "link",
    people: [{ id: "lm", role: "editor" }],
  });
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Share
      </Button>
      <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>
        {settings.people.length} people · {settings.general}
        {copied ? " · link copied" : ""}
      </span>
      {open ? (
        <ShareDialog
          itemName="Proposal Lyon Logistique.docx"
          directory={directory}
          organization="Atelier Moreau"
          inherited={[{ person: { id: "cr", name: "Camille Roy", hint: "Sales" }, role: "Owner" }]}
          linkUrl="https://drive.example.com/s/p7Kq2"
          onCopyLink={() => setCopied(true)}
          value={settings}
          onChange={setSettings}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
