import { Separator } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 16, width: 360 }}>
      <span>Profile</span>
      <Separator />
      <div style={{ display: "flex", gap: 12, height: 20 }}>
        <span>Members</span>
        <Separator orientation="vertical" />
        <span>Teams</span>
        <Separator orientation="vertical" />
        <span>Access</span>
      </div>
    </div>
  );
}
