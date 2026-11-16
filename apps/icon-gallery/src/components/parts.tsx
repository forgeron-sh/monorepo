import { manifest } from "@forgeron/icons/catalog";

const INDEX = new Map(manifest.map((e, i) => [e.name, i + 1]));

/** The figure number of an icon, as the landing pages number their drawings: `FIG.0042`. */
export const fig = (name: string) => `FIG.${String(INDEX.get(name) ?? 0).padStart(4, "0")}`;

/** The empty grid of an icon still to draw. */
export function StubMark({ size }: { size: number }) {
  return (
    <span className="stub-mark" style={{ width: size, height: size }} aria-hidden="true">
      <span />
    </span>
  );
}
