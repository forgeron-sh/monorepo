import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { Filter } from "../core/filters";
import { renderSvg } from "../core/svg";
import type { Block, SceneSource } from "../core/types";
import { type Mounted, mount, type MountOptions } from "../dom/mount";
import { collect } from "./markers";

export interface BlueprintProps {
  /** The scene: data, or a function of `{ t, active }`. Blocks written as children are added to it. */
  scene?: SceneSource;
  /** Blocks (`<Box>`, `<Line>`, `<Dot>`, `<Label>`) and filters (`<Pixelate>`, `<Dither>`…). */
  children?: ReactNode;
  /** Filters as data, run before the filters written as children. */
  filters?: readonly Filter[];
  /** Size of the static frame in CSS pixels (480 × 320 by default); also the aspect ratio. */
  width?: number;
  height?: number;
  /** Accessible name; without it the picture is decorative. */
  title?: string;
  active?: number;
  cycle?: MountOptions["cycle"];
  labels?: boolean;
  onActive?: (active: number) => void;
  className?: string;
  style?: CSSProperties;
}

function combine(scene: SceneSource | undefined, extra: readonly Block[]): SceneSource {
  if (!scene) return { blocks: extra };
  if (extra.length === 0) return scene;
  if (typeof scene === "function")
    return (frame) => {
      const s = scene(frame);
      return { ...s, blocks: [...s.blocks, ...extra] };
    };
  return { ...scene, blocks: [...scene.blocks, ...extra] };
}

/**
 * A scene, rendered as a static SVG during render (server and client alike, the picture without
 * JavaScript) and taken over by an animated canvas once mounted in the browser. The SVG is hidden
 * after the canvas has drawn its first frame.
 */
export function Blueprint(props: BlueprintProps) {
  const { width = 480, height = 320, title, active, cycle, labels, className, style } = props;
  const collected = collect(props.children);
  const blocksKey = JSON.stringify(collected.blocks);
  const filters = useMemo(
    () => [...(props.filters ?? []), ...collected.filters],
    // The chain is data: its JSON is its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(props.filters ?? []), JSON.stringify(collected.filters)],
  );
  const source = useMemo(
    () => combine(props.scene, collected.blocks),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.scene, blocksKey],
  );
  const staticActive = active ?? (cycle ? 0 : -1);
  const svg = useMemo(
    () => renderSvg(source, { width, height, filters, labels, active: staticActive }),
    [source, width, height, filters, labels, staticActive],
  );

  const canvas = useRef<HTMLCanvasElement>(null);
  const mounted = useRef<Mounted | null>(null);
  const onActive = useRef(props.onActive);
  onActive.current = props.onActive;
  const [live, setLive] = useState(false);
  const liveRef = useRef(false);

  const options: MountOptions = {
    filters,
    active,
    cycle,
    labels,
    onActive: (n) => onActive.current?.(n),
    onDraw: () => {
      if (liveRef.current) return;
      liveRef.current = true;
      setLive(true);
    },
  };
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const sourceRef = useRef(source);
  sourceRef.current = source;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const m = mount(el, sourceRef.current, optionsRef.current);
    mounted.current = m;
    return () => {
      m.destroy();
      mounted.current = null;
    };
  }, []);

  const cycleKey = cycle ? `${cycle.every}/${cycle.count}` : "";
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    mounted.current?.update(sourceRef.current, optionsRef.current);
  }, [source, filters, active, cycleKey, labels]);

  const fill: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };
  return (
    <div
      className={className}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      style={{ position: "relative", aspectRatio: `${width} / ${height}`, ...style }}
    >
      <div
        data-blueprint-static=""
        style={{ ...fill, display: live ? "none" : "block" }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <canvas ref={canvas} data-blueprint-canvas="" aria-hidden="true" style={fill} />
    </div>
  );
}
