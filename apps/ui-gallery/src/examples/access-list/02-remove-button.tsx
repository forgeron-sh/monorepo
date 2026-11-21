import {
  AccessList,
  AccessListFixed,
  AccessListItem,
  AccessListRemove,
  AccessListRole,
} from "@forgeron/ui";
import { useState } from "react";

const roles = [
  { value: "approver", label: "Approver" },
  { value: "reviewer", label: "Reviewer" },
];

export default function RemoveButton() {
  const [people, setPeople] = useState([
    { id: "grace", name: "Grace Hopper", role: "approver" },
    { id: "dieter", name: "Dieter Rams", role: "reviewer" },
  ]);
  return (
    <AccessList aria-label="Participants" style={{ width: 380 }}>
      <AccessListItem name="Ada Lovelace" secondary="ada@example.com">
        <AccessListFixed>Owner</AccessListFixed>
      </AccessListItem>
      {people.map((p) => (
        <AccessListItem key={p.id} name={p.name}>
          <AccessListRole label={`Role of ${p.name}`} roles={roles} defaultValue={p.role} />
          <AccessListRemove
            aria-label={`Remove ${p.name}`}
            onClick={() => setPeople(people.filter((x) => x.id !== p.id))}
          />
        </AccessListItem>
      ))}
    </AccessList>
  );
}
