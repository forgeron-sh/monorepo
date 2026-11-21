import { ScrollArea } from "@forgeron/ui";

const tags = Array.from({ length: 30 }, (_, i) => `v1.${30 - i}.0`);

export default function Default() {
  return (
    <ScrollArea style={{ height: 200, width: 192 }}>
      <div style={{ padding: 12 }}>
        <p className="fg-pop-heading">Releases</p>
        {tags.map((tag) => (
          <div key={tag} style={{ padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
