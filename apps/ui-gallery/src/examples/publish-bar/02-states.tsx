import { PublishBar } from "@forgeron/ui";

export default function States() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <PublishBar changes={3} onPublish={() => {}} />
      <PublishBar version={4} changes={0} active onActiveChange={() => {}} onPublish={() => {}} />
      <PublishBar version={4} changes={2} active onActiveChange={() => {}} onPublish={() => {}} />
    </div>
  );
}
