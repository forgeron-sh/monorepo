import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { BlueprintError } from "../core/blocks";
import {
  type DitherFilter,
  type Filter,
  type GlowFilter,
  type GridFilter,
  type PaletteFilter,
} from "../core/filters";
import type { Block, BoxBlock, DotBlock, LabelBlock, LineBlock } from "../core/types";

/**
 * Marker components: they render nothing. `<Blueprint>` walks its children and turns each marker
 * into the block or filter it describes, synchronously, the same way on the server and in the
 * browser. No reconciler, no context: the scene stays plain data.
 */

const SPEC = Symbol.for("@forgeron/blueprint/marker");

type Spec = { block: (props: never) => Block } | { filter: (props: never) => Filter };

type Marker<P> = ((props: P) => null) & { displayName: string; [SPEC]: Spec };

function marker<P>(displayName: string, spec: Spec): Marker<P> {
  const component = (() => null) as unknown as Marker<P>;
  component.displayName = displayName;
  component[SPEC] = spec;
  return component;
}

export type BoxProps = Omit<BoxBlock, "kind">;
export type LineProps = Omit<LineBlock, "kind">;
export type DotProps = Omit<DotBlock, "kind">;
export type LabelProps = Omit<LabelBlock, "kind">;
export type PixelateProps = { size: number };
export type DitherProps = Omit<DitherFilter, "type">;
export type GlowProps = Omit<GlowFilter, "type">;
export type PaletteProps = Omit<PaletteFilter, "type">;
export type GridProps = Omit<GridFilter, "type">;

export const Box = marker<BoxProps>("Box", { block: (p: BoxProps) => ({ kind: "box", ...p }) });
export const Line = marker<LineProps>("Line", {
  block: (p: LineProps) => ({ kind: "line", ...p }),
});
export const Dot = marker<DotProps>("Dot", { block: (p: DotProps) => ({ kind: "dot", ...p }) });
export const Label = marker<LabelProps>("Label", {
  block: (p: LabelProps) => ({ kind: "label", ...p }),
});

export const Pixelate = marker<PixelateProps>("Pixelate", {
  filter: (p: PixelateProps) => ({ type: "pixelate", size: p.size }),
});
export const Dither = marker<DitherProps>("Dither", {
  filter: (p: DitherProps) => ({ type: "dither", ...p }),
});
export const Glow = marker<GlowProps>("Glow", {
  filter: (p: GlowProps) => ({ type: "glow", ...p }),
});
export const Palette = marker<PaletteProps>("Palette", {
  filter: (p: PaletteProps) => ({ type: "palette", ...p }),
});
export const Grid = marker<GridProps>("Grid", {
  filter: (p: GridProps) => ({ type: "grid", ...p }),
});

/** Strips `children` (React adds it when a marker is written with content) before conversion. */
function dataOf(props: Record<string, unknown>): never {
  const { children: _children, ...rest } = props;
  return rest as never;
}

/**
 * The blocks and filters described by `children`, in order. Arrays and fragments are walked;
 * `null`, `false` and `undefined` are skipped; anything else is an error that names it, since a
 * component of one's own is not run (compose with plain functions that return markers).
 */
export function collect(children: ReactNode): { blocks: Block[]; filters: Filter[] } {
  const blocks: Block[] = [];
  const filters: Filter[] = [];
  const walk = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (child === null || child === undefined || typeof child === "boolean") return;
      if (!isValidElement(child)) {
        if (typeof child === "string" && child.trim() === "") return;
        throw new BlueprintError(
          `<Blueprint> accepts blocks and filters only, not the text "${String(child)}".`,
        );
      }
      const props = child.props as Record<string, unknown>;
      if (child.type === Fragment) {
        walk(props.children as ReactNode);
        return;
      }
      const spec = (child.type as Partial<Marker<unknown>>)[SPEC];
      if (!spec) {
        const t = child.type as { displayName?: string; name?: string } | string;
        const name = typeof t === "string" ? t : (t.displayName ?? t.name ?? "anonymous");
        throw new BlueprintError(
          `<Blueprint> accepts blocks and filters only, not <${name}>: return markers from a plain function instead.`,
        );
      }
      if ("block" in spec) blocks.push(spec.block(dataOf(props)));
      else filters.push(spec.filter(dataOf(props)));
    });
  };
  walk(children);
  return { blocks, filters };
}
