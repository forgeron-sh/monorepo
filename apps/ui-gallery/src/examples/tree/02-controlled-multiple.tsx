import { TreeGroup, TreeItem, TreeItemContent, Tree } from "@forgeron/ui";
import { useState } from "react";

const teams = [
  { id: "eng", name: "Engineering", members: ["Ada", "Grace", "Linus"] },
  { id: "design", name: "Design", members: ["Dieter", "Paula"] },
  { id: "ops", name: "Operations", members: [] as string[] },
];

export default function ControlledMultiple() {
  const [expanded, setExpanded] = useState<string[]>(["eng"]);
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div style={{ display: "grid", gap: 12, width: 280 }}>
      <Tree
        aria-label="Teams"
        selectionMode="multiple"
        expanded={expanded}
        onExpandedChange={setExpanded}
        selected={selected}
        onSelectedChange={setSelected}
      >
        {teams.map((team) => (
          <TreeItem key={team.id} id={team.id} textValue={team.name}>
            <TreeItemContent>
              <span className="fg-tree-name">{team.name}</span>
            </TreeItemContent>
            {team.members.length > 0 ? (
              <TreeGroup>
                {team.members.map((name) => (
                  <TreeItem key={name} id={`${team.id}-${name}`} textValue={name}>
                    <TreeItemContent>
                      <span className="fg-tree-name">{name}</span>
                    </TreeItemContent>
                  </TreeItem>
                ))}
              </TreeGroup>
            ) : null}
          </TreeItem>
        ))}
      </Tree>
      <small>
        Open: {expanded.join(", ") || "none"} · Selected: {selected.join(", ") || "none"}
      </small>
    </div>
  );
}
