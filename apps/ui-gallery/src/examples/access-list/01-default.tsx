import {
  AccessList,
  AccessListEmpty,
  AccessListItem,
  AccessListRole,
  PeopleCombobox,
} from "@forgeron/ui";
import { useState } from "react";

const directory = [
  { id: "ada", name: "Ada Lovelace", hint: "Engineering" },
  { id: "grace", name: "Grace Hopper", hint: "Engineering" },
  { id: "dieter", name: "Dieter Rams", hint: "Design" },
  { id: "paula", name: "Paula Scher", hint: "Design" },
];
const roles = [
  { value: "viewer", label: "Viewer" },
  { value: "commenter", label: "Commenter" },
  { value: "editor", label: "Editor" },
];

export default function Default() {
  const [grants, setGrants] = useState([{ id: "ada", role: "editor" }]);
  const listed = new Set(grants.map((g) => g.id));
  return (
    <div style={{ display: "grid", gap: 12, width: 380 }}>
      <PeopleCombobox
        label="Add people"
        placeholder="Add people"
        people={directory.filter((p) => !listed.has(p.id))}
        onAdd={(p) => setGrants([...grants, { id: p.id, role: "viewer" }])}
      />
      <AccessList aria-label="People with access">
        {grants.map((g) => {
          const person = directory.find((p) => p.id === g.id)!;
          return (
            <AccessListItem key={g.id} name={person.name} secondary={person.hint}>
              <AccessListRole
                label={`Role of ${person.name}`}
                roles={roles}
                value={g.role}
                onValueChange={(role) =>
                  setGrants(grants.map((x) => (x.id === g.id ? { ...x, role } : x)))
                }
                onRemove={() => setGrants(grants.filter((x) => x.id !== g.id))}
              />
            </AccessListItem>
          );
        })}
        {grants.length === 0 ? <AccessListEmpty>Only you</AccessListEmpty> : null}
      </AccessList>
    </div>
  );
}
