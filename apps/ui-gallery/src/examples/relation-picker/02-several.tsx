// Several records at once: the list stays open while they are ticked; search by name, id or hint.
import { RelationPicker } from "@forgeron/ui";
import { useState } from "react";

const contacts = [
  { id: "p-1", label: "Camille Roy", hint: "Fromagerie Roy" },
  { id: "p-2", label: "Hugo Bernard", hint: "Garnier" },
  { id: "p-3", label: "Léa Martin", hint: "Martin Distribution" },
  { id: "p-4", label: "Nadia Petit", hint: "Petit & Fils" },
  { id: "p-5", label: "Tom Garnier", hint: "Garnier" },
];

export default function Several() {
  const [ids, setIds] = useState<string[]>(["p-1", "p-3"]);
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ width: 320 }}>
        <RelationPicker
          label="Contacts"
          multiple
          targets={contacts}
          value={ids}
          onChange={setIds}
        />
      </div>
      <RelationPicker
        label="Contacts"
        variant="chip"
        multiple
        targets={contacts}
        value={ids}
        onChange={setIds}
      />
    </div>
  );
}
