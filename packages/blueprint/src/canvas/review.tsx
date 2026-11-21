// The z-buffer review sheet (docs/blueprint/engine.md, P5): every scene of a library drawn in
// painter's order and with the depth buffer, side by side, with the pixels that differ, so the
// owner decides scene by scene whether it moves to the z-buffer (D-150, question 1). Rows draw
// when they come near the screen; the choices stay in this browser and copy out as JSON.

import { plan, type ResolvedPalette, resolvePalette } from "../index";
import { BlueprintScene } from "../engine";
import { encodeScene, type Library } from "../format";
import { Button, Segmented } from "@forgeron/ui";
import { useEffect, useRef, useState } from "react";
import { type LibraryEntry, type OpenedFile, openBlueprint } from "./document";
import type { Depth } from "./kind";
import { DEFAULT_FILL, withView } from "./scenes";

/** A still frame: its raster size, palette slots and RGBA. */
export interface Still {
  width: number;
  height: number;
  slots: Uint8Array;
  rgba: Uint8ClampedArray;
}

/** One scene of a library at `t = 0`, in a depth mode, on a raster of `width` × `height`. */
export function renderStill(
  lib: Library,
  name: string,
  options: {
    depth: Depth;
    width: number;
    height: number;
    colors: ResolvedPalette;
    view?: 0 | 1 | 2 | 3;
  },
): Still {
  const spec = lib.scenes.get(name);
  const encoded = encodeScene(lib, name, { fill: spec?.camera.fit.fill ?? DEFAULT_FILL });
  const active = spec?.vars?.active;
  const scene = new BlueprintScene(
    { ...encoded, bytes: withView(encoded, options.view ?? 0, options.depth) },
    active?.type === "int"
      ? { default: active.default, ...(active.cycle ? { cycle: active.cycle } : {}) }
      : null,
  );
  try {
    scene.resize(options.width, options.height);
    scene.palette(options.colors);
    scene.frame(0, 0);
    const { width, height } = scene.size;
    return { width, height, slots: scene.slots.slice(), rgba: scene.rgba!.slice() };
  } finally {
    scene.dispose();
  }
}

/** Pixels whose slot differs between two stills of one size, and the share of the drawn ones. */
function difference(a: Still, b: Still): { mask: Uint8Array; share: number } {
  const mask = new Uint8Array(a.slots.length);
  let differ = 0;
  let drawn = 0;
  for (let i = 0; i < mask.length; i++) {
    const sa = a.slots[i]!;
    const sb = b.slots[i]!;
    if (sa || sb) drawn++;
    if (sa !== sb) {
      mask[i] = 1;
      differ++;
    }
  }
  return { mask, share: drawn ? differ / drawn : 0 };
}

function put(
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number,
  rgba: Uint8ClampedArray,
) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  canvas.width = width;
  canvas.height = height;
  const image = ctx.createImageData(width, height);
  image.data.set(rgba);
  ctx.putImageData(image, 0, 0);
}

/** The diff picture: the painter frame faded, the differing pixels in the accent. */
function diffRgba(base: Still, mask: Uint8Array, colors: ResolvedPalette): Uint8ClampedArray {
  const out = new Uint8ClampedArray(base.rgba.length);
  const [ar, ag, ab] = colors.accent;
  for (let i = 0; i < mask.length; i++) {
    const o = i * 4;
    if (mask[i]) {
      out[o] = ar;
      out[o + 1] = ag;
      out[o + 2] = ab;
      out[o + 3] = 255;
    } else if (base.rgba[o + 3]) {
      out[o] = base.rgba[o]!;
      out[o + 1] = base.rgba[o + 1]!;
      out[o + 2] = base.rgba[o + 2]!;
      out[o + 3] = 64;
    }
  }
  return out;
}

export interface DepthReviewProps {
  library: readonly LibraryEntry[];
  /** Raster size of each still; drawn at twice that in CSS pixels. Default 240 × 150. */
  raster?: { width: number; height: number };
  /** Where the choices are kept in this browser. */
  storageKey?: string;
}

type Choice = "undecided" | "painter" | "zbuffer";
const CHOICES = [
  { value: "undecided", label: "Undecided" },
  { value: "painter", label: "Keep painter" },
  { value: "zbuffer", label: "Z-buffer" },
];

function readChoices(key: string): Record<string, Choice> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, Choice>;
  } catch {
    return {};
  }
}

export function DepthReview({
  library,
  raster = { width: 240, height: 150 },
  storageKey = "blueprint-depth-review",
}: DepthReviewProps) {
  const [choices, setChoices] = useState<Record<string, Choice>>(() => readChoices(storageKey));
  const [copied, setCopied] = useState(false);
  const choose = (scene: string, choice: Choice) => {
    const next = { ...choices, [scene]: choice };
    setChoices(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Storage refused (a private window): the choice holds until the page closes.
    }
  };
  const decided = Object.entries(choices).filter(([, c]) => c !== "undecided");
  return (
    <div className="fg-bpr">
      <div className="fg-bpr-bar t-mono">
        <span className="dim">
          {decided.length} of {library.length} decided · painter | z-buffer | pixels that differ
        </span>
        <Button
          size="sm"
          onClick={() => {
            const text = JSON.stringify(Object.fromEntries(decided), null, 2);
            void navigator.clipboard?.writeText(text).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy choices"}
        </Button>
      </div>
      <ol className="fg-bpr-list">
        {library.map((entry) => (
          <ReviewRow
            key={entry.name}
            entry={entry}
            raster={raster}
            choice={choices[entry.name] ?? "undecided"}
            onChoose={(c) => choose(entry.name, c)}
          />
        ))}
      </ol>
    </div>
  );
}

function ReviewRow({
  entry,
  raster,
  choice,
  onChoose,
}: {
  entry: LibraryEntry;
  raster: { width: number; height: number };
  choice: Choice;
  onChoose: (c: Choice) => void;
}) {
  const row = useRef<HTMLLIElement>(null);
  const painter = useRef<HTMLCanvasElement>(null);
  const zbuffer = useRef<HTMLCanvasElement>(null);
  const diff = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<
    | { status: "waiting" }
    | { status: "done"; share: number; scene: string; animated: boolean }
    | { status: "error"; message: string }
  >({ status: "waiting" });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    let live = true;
    const draw = async () => {
      try {
        const file: OpenedFile = await openBlueprint(entry.name, await entry.load());
        const first = file.outline.scenes[0];
        if (!first) throw new Error("no scene");
        const style = getComputedStyle(el);
        const colors = resolvePalette(
          plan().colors,
          (n) => style.getPropertyValue(n).trim() || undefined,
        );
        const opts = { width: raster.width, height: raster.height, colors };
        const a = renderStill(file.lib, first.name, { ...opts, depth: "painter" });
        const b = renderStill(file.lib, first.name, { ...opts, depth: "zbuffer" });
        if (!live) return;
        const d = difference(a, b);
        put(painter.current, a.width, a.height, a.rgba);
        put(zbuffer.current, b.width, b.height, b.rgba);
        put(diff.current, a.width, a.height, diffRgba(a, d.mask, colors));
        setState({ status: "done", share: d.share, scene: first.name, animated: first.animated });
      } catch (e) {
        if (live) setState({ status: "error", message: (e as Error).message });
      }
    };
    if (typeof IntersectionObserver === "undefined") {
      void draw();
      return () => {
        live = false;
      };
    }
    const seen = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        seen.disconnect();
        void draw();
      },
      { rootMargin: "50% 0px" },
    );
    seen.observe(el);
    return () => {
      live = false;
      seen.disconnect();
    };
  }, [entry, raster.width, raster.height]);

  const size = { width: raster.width * 2, height: raster.height * 2 };
  return (
    <li ref={row} className="fg-bpr-row" data-scene={entry.name}>
      <header className="fg-bpr-head t-mono">
        <span>{entry.name}</span>
        <span className="dim">
          {state.status === "done"
            ? `${(state.share * 100).toFixed(2)} % differ${state.animated ? " · animated, t = 0" : ""}`
            : state.status === "error"
              ? state.message
              : "…"}
        </span>
        <Segmented
          label={`Depth for ${entry.name}`}
          options={CHOICES}
          value={choice}
          onChange={(v) => onChoose(v as Choice)}
        />
      </header>
      <div className="fg-bpr-pics">
        <canvas ref={painter} aria-label={`${entry.name} in painter's order`} style={size} />
        <canvas ref={zbuffer} aria-label={`${entry.name} with the z-buffer`} style={size} />
        <canvas ref={diff} aria-label={`${entry.name}: pixels that differ`} style={size} />
      </div>
    </li>
  );
}
