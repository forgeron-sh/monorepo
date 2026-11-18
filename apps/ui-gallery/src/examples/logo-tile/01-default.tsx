import { CloudflareIcon } from "@forgeron/icons";
import { LogoTile } from "@forgeron/ui";

// A pixel mark, or the initial when the product has none.
export default function Default() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <LogoTile icon={CloudflareIcon} />
      <LogoTile name="Linear" />
    </div>
  );
}
