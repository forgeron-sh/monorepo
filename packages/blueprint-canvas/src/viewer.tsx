// <BlueprintViewer>: open a `.bp` (a file picked or dropped, or one of a library the host lists),
// see its parts, assemblies and scenes, show one on a canvas in the four iso views, play, pause and
// scrub its clock, set its vars and read its machines' states; hover shows the tag under the
// pointer. The chrome is @forgeron/ui's; the scene is an item of @forgeron/canvas drawn by
// <BlueprintLayer> (docs/blueprint/engine.md, P5).

import { engineStarted, initBlueprint } from "@forgeron/blueprint/engine";
import type { Turn } from "@forgeron/blueprint/format";
import { Canvas, useCanvasStore, ZoomControls } from "@forgeron/canvas/react";
import { PauseIcon, PlayIcon } from "@forgeron/icons";
import {
  Badge,
  EmptyState,
  FileInput,
  IconButton,
  Notice,
  Segmented,
  Select,
  Slider,
  Switch,
  Tree,
  type TreeNode,
} from "@forgeron/ui";
import {
  type DragEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type LibraryEntry,
  type OpenedFile,
  openBlueprint,
  type OutlineScene,
  scrubLength,
} from "./document";
import {
  type BlueprintItemData,
  blueprintItem,
  blueprintKind,
  BLUEPRINT_KIND,
  type Depth,
  VIEWS,
} from "./kind";
import { BlueprintLayer } from "./layer";
import { BlueprintStage, type HoverHit } from "./stage";

export interface BlueprintViewerProps {
  /** Files the host offers (the site's library), opened on demand. */
  library?: readonly LibraryEntry[];
  /** The entry opened first, by name. */
  initial?: string;
  /** The size a scene is framed in at zoom 1, in CSS pixels. Default: the stage's own size. */
  frame?: { w: number; h: number };
  /** The layer's compositor: WebGL2 (default) or the 2D canvas. */
  compositor?: "webgl2" | "2d";
  /** Hands the stage out (tests, perf probes). */
  onStage?: (stage: BlueprintStage) => void;
  className?: string;
}

/** What is shown: a scene, or a part or an assembly framed alone. */
interface Target {
  kind: "scene" | "part" | "assembly";
  name: string;
}

const ITEM = "shown";
/** The frame when the stage has no size yet (it is not laid out). */
const FALLBACK_FRAME = { w: 720, h: 450 };
const DEPTHS = [
  { value: "file", label: "File" },
  { value: "painter", label: "Painter" },
  { value: "zbuffer", label: "Z-buffer" },
];

const firstTarget = (file: OpenedFile): Target | null => {
  const o = file.outline;
  if (o.scenes[0]) return { kind: "scene", name: o.scenes[0].name };
  if (o.assemblies[0]) return { kind: "assembly", name: o.assemblies[0].name };
  if (o.parts[0]) return { kind: "part", name: o.parts[0].name };
  return null;
};

const targetId = (t: Target) => `${t.kind}:${t.name}`;

function outlineTree(file: OpenedFile): TreeNode[] {
  const o = file.outline;
  const group = (id: string, label: string, children: TreeNode[]): TreeNode => ({
    id,
    label,
    count: children.length,
    children,
  });
  return [
    group(
      "scenes",
      "Scenes",
      o.scenes.map((s) => ({
        id: `scene:${s.name}`,
        label: s.name,
        ...(s.animated ? { badge: <Badge>live</Badge> } : {}),
      })),
    ),
    group(
      "assemblies",
      "Assemblies",
      o.assemblies.map((a) => ({ id: `assembly:${a.name}`, label: a.name, count: a.instances })),
    ),
    group(
      "parts",
      "Parts",
      o.parts.map((p) => ({ id: `part:${p.name}`, label: p.name, count: p.prims })),
    ),
  ];
}

export function BlueprintViewer({
  library = [],
  initial,
  frame,
  compositor,
  onStage,
  className,
}: BlueprintViewerProps) {
  const [ready, setReady] = useState(engineStarted);
  const [files] = useState(() => new Map<string, OpenedFile>());
  const [file, setFile] = useState<OpenedFile | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [view, setView] = useState<Turn>(0);
  const [depth, setDepth] = useState<"file" | Depth>("file");
  const [timeline, setTimeline] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState<HoverHit | null>(null);
  const [stage] = useState(
    () => new BlueprintStage({ resolve: (name) => files.get(name)?.lib, compositor }),
  );
  const store = useCanvasStore<BlueprintItemData>({
    kinds: { [BLUEPRINT_KIND]: blueprintKind },
    grid: { snap: false },
  });

  useEffect(() => {
    onStage?.(stage);
  }, [onStage, stage]);
  useEffect(() => () => stage.dispose(), [stage]);
  useEffect(() => {
    if (ready) return;
    let live = true;
    void initBlueprint().then(
      () => live && setReady(true),
      (e: unknown) => live && setError(`The engine did not start: ${String(e)}`),
    );
    return () => {
      live = false;
    };
  }, [ready]);

  const open = useCallback(
    async (name: string, content: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        const opened = await openBlueprint(name, await content());
        files.set(name, opened);
        setFile(opened);
        setTarget(firstTarget(opened));
        setTimeline(null);
        stage.pause();
        stage.seek(0);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [files, stage],
  );

  // The first file, once the engine runs.
  useEffect(() => {
    if (!ready || library.length === 0) return;
    const entry = library.find((e) => e.name === initial) ?? library[0]!;
    const id = setTimeout(() => void open(entry.name, entry.load), 0);
    return () => clearTimeout(id);
    // Once: a later library list does not reopen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // The item on the canvas follows the file, the target, the view and the depth.
  const data = useMemo<BlueprintItemData | null>(() => {
    if (!file || !target) return null;
    return {
      file: file.name,
      scene: target.name,
      view,
      ...(depth !== "file" ? { depth } : {}),
      ...(target.kind !== "scene" ? { preview: target.kind } : {}),
    };
  }, [file, target, view, depth]);
  // A layout effect: the item changes before the next paint, so a view switch draws in the frame
  // after the click.
  useLayoutEffect(() => {
    if (!ready) return;
    if (!data) {
      store.replace([]);
      return;
    }
    const state = store.getState();
    const current = state.items[0];
    const moved = !current || current.data.file !== data.file || current.data.scene !== data.scene;
    // A new scene is framed in the stage as it is (zoom 1, one raster pixel per `pixel` CSS
    // pixels), or in `frame`; a new view or depth keeps the item and the camera.
    const size = frame ?? (state.size.w > 0 ? state.size : FALLBACK_FRAME);
    const bounds = moved || !current ? size : { w: current.bounds.w, h: current.bounds.h };
    store.replace([blueprintItem(ITEM, data, { x: 0, y: 0 }, bounds)], state.viewport);
    if (!moved) return;
    if (!frame && state.size.w > 0) store.setViewport({ x: 0, y: 0, zoom: 1 });
    else store.fitView({ padding: 24, maxZoom: 1 });
  }, [ready, data, store, frame]);

  const scene: OutlineScene | undefined =
    target?.kind === "scene" ? file?.outline.scenes.find((s) => s.name === target.name) : undefined;

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    const dropped = e.dataTransfer?.files?.[0];
    if (!dropped) return;
    e.preventDefault();
    void open(dropped.name, () => dropped.text());
  };

  const selected = target ? [targetId(target)] : [];
  return (
    <div className={["fg-bpv", className].filter(Boolean).join(" ")}>
      <aside className="fg-bpv-side" aria-label="File">
        {library.length > 0 ? (
          <Select
            aria-label="Library"
            value={file && library.some((e) => e.name === file.name) ? file.name : ""}
            placeholder="Library scene…"
            options={library.map((e) => ({ value: e.name, label: e.name }))}
            onChange={(e) => {
              const entry = library.find((x) => x.name === e.target.value);
              if (entry) void open(entry.name, entry.load);
            }}
          />
        ) : null}
        <FileInput
          label="Open a .bp"
          accept=".bp,.json,application/json"
          hint="Drop a .bp here, or"
          onChange={(list) => {
            const f = list[0];
            if (f) void open(f.name, () => f.text());
          }}
        />
        {file ? (
          <Tree
            label={`Contents of ${file.name}`}
            items={outlineTree(file)}
            defaultExpanded={["scenes"]}
            selected={selected}
            onSelectedChange={(ids) => {
              const id = ids[0];
              if (!id || !id.includes(":")) return;
              const [kind, ...rest] = id.split(":");
              setTarget({ kind: kind as Target["kind"], name: rest.join(":") });
              setTimeline(null);
            }}
          />
        ) : null}
      </aside>

      <section
        className="fg-bpv-main"
        aria-label="Scene"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="fg-bpv-bar">
          <Segmented
            label="View"
            options={VIEWS.map((v) => ({ value: String(v.view), label: v.label }))}
            value={String(view)}
            onChange={(v) => setView(Number(v) as Turn)}
          />
          <Segmented
            label="Depth"
            options={DEPTHS}
            value={depth}
            onChange={(v) => setDepth(v as "file" | Depth)}
          />
          <span className="fg-bpv-title t-mono dim">
            {busy ? "Reading…" : file ? `${file.name} / ${target?.name ?? "—"}` : "No file"}
          </span>
        </div>
        {error ? (
          <Notice tone="danger" title="Could not open">
            {error}
          </Notice>
        ) : null}
        <div className="fg-bpv-stage">
          {ready ? (
            <Canvas
              store={store}
              label="Blueprint scene"
              className="fg-bpv-canvas"
              renderItem={() => null}
              keyboard="focus"
              layers={{ below: <BlueprintLayer stage={stage} onHover={setHover} /> }}
            >
              <ZoomControls />
            </Canvas>
          ) : (
            <EmptyState title="Starting the engine…" />
          )}
          <output className="fg-bpv-hover t-mono" aria-live="polite">
            {hover?.tag ? hover.tag : ""}
          </output>
        </div>
        <Transport stage={stage} scene={scene} timeline={timeline} onTimeline={setTimeline} />
      </section>

      <aside className="fg-bpv-inspect" aria-label="Inputs">
        {scene ? (
          <Inputs key={`${file?.name}:${scene.name}`} stage={stage} scene={scene} hover={hover} />
        ) : (
          <p className="t-small dim">
            {target
              ? `${target.kind === "part" ? "Part" : "Assembly"} shown alone.`
              : "Nothing shown."}
          </p>
        )}
        <Stats stage={stage} />
      </aside>
    </div>
  );
}

/** Re-renders on every stage draw (the clock, the states). */
function useStage<T>(stage: BlueprintStage, read: () => T): T {
  return useSyncExternalStore(
    useCallback((fn) => stage.subscribe(fn), [stage]),
    read,
    read,
  );
}

const fmt = (t: number) => `${t.toFixed(2)} s`;

function Transport({
  stage,
  scene,
  timeline,
  onTimeline,
}: {
  stage: BlueprintStage;
  scene: OutlineScene | undefined;
  timeline: string | null;
  onTimeline: (name: string | null) => void;
}) {
  const time = useStage(stage, () => stage.time);
  const playing = useStage(stage, () => stage.playing);
  const length = scrubLength(scene, timeline);
  const timelines = scene?.timelines ?? [];
  return (
    <div className="fg-bpv-transport">
      <IconButton
        icon={playing ? PauseIcon : PlayIcon}
        label={playing ? "Pause" : "Play"}
        onClick={() => (playing ? stage.pause() : stage.play())}
      />
      <Slider
        className="fg-bpv-scrub"
        label="Time"
        min={0}
        max={length}
        step={0.01}
        value={Math.min(time, length)}
        formatValue={fmt}
        onChange={(v) => {
          stage.pause();
          stage.seek(typeof v === "number" ? v : v[0]);
        }}
      />
      <span className="t-mono fg-bpv-time">{fmt(time)}</span>
      {timelines.length > 0 ? (
        <Select
          aria-label="Timeline"
          value={timeline ?? ""}
          options={[
            { value: "", label: "All timelines" },
            ...timelines.map((t) => ({ value: t.name, label: t.name })),
          ]}
          onChange={(e) => onTimeline(e.target.value || null)}
        />
      ) : null}
    </div>
  );
}

function Inputs({
  stage,
  scene,
  hover,
}: {
  stage: BlueprintStage;
  scene: OutlineScene;
  hover: HoverHit | null;
}) {
  const handle = () => stage.sceneOf(ITEM)?.scene ?? null;
  // The values as the engine output them after the last frame (a cycle, a machine's `set`).
  const read = (name: string) => handle()?.get(name) ?? Number.NaN;
  const states = useStage(stage, () =>
    scene.machines.map((_, i) => handle()?.state(i) ?? "").join("\u0000"),
  );
  const values = useStage(stage, () =>
    [...scene.vars.map((v) => v.name), ...scene.params.map((p) => p.name)]
      .map((n) => read(n))
      .join(","),
  );
  const [auto, setAuto] = useState<Record<string, boolean>>({});
  const current = values.split(",").map(Number);
  const valueOf = (i: number) => current[i] ?? Number.NaN;
  const params = scene.params.length <= 16 ? scene.params : [];
  return (
    <div className="fg-bpv-inputs">
      <h3 className="t-mono dim fg-bpv-head">Vars</h3>
      {scene.vars.length === 0 ? <p className="t-small dim">None.</p> : null}
      {scene.vars.map((v, i) => {
        const spec = v.spec;
        if (spec.type === "progress")
          return (
            <Slider
              key={v.name}
              label={v.name}
              min={0}
              max={1}
              step={0.005}
              showValue
              value={Number.isNaN(valueOf(i)) ? (spec.default ?? 0) : valueOf(i)}
              formatValue={(x) => x.toFixed(3)}
              onChange={(x) => stage.set(ITEM, v.name, typeof x === "number" ? x : x[0])}
            />
          );
        if (spec.type === "int") {
          const max = Math.max(1, (spec.cycle?.count ?? 10) - 1);
          const free = auto[v.name] ?? true;
          return (
            <div key={v.name} className="fg-bpv-int">
              <Slider
                label={v.name}
                min={-1}
                max={max}
                step={1}
                showValue
                value={Number.isNaN(valueOf(i)) ? spec.default : valueOf(i)}
                onChange={(x) => {
                  setAuto((a) => ({ ...a, [v.name]: false }));
                  stage.set(ITEM, v.name, typeof x === "number" ? x : x[0]);
                }}
              />
              <Switch
                label={spec.cycle ? "Cycle" : "Default"}
                checked={free}
                onChange={(e) => {
                  const on = e.currentTarget.checked;
                  setAuto((a) => ({ ...a, [v.name]: on }));
                  if (on) stage.release(ITEM, v.name);
                  else stage.set(ITEM, v.name, valueOf(i));
                }}
              />
            </div>
          );
        }
        if (spec.type === "pointer")
          return (
            <p key={v.name} className="t-mono fg-bpv-row">
              <span className="dim">{v.name}</span> {hover?.tag || "—"}
            </p>
          );
        return (
          <p key={v.name} className="t-mono fg-bpv-row">
            <span className="dim">{v.name}</span> the clock
          </p>
        );
      })}
      {params.length > 0 ? <h3 className="t-mono dim fg-bpv-head">Root params</h3> : null}
      {params.map((p, k) => {
        const value = valueOf(scene.vars.length + k);
        if (p.type === "flag")
          return (
            <Switch
              key={p.name}
              label={p.name}
              checked={Number.isNaN(value) ? Boolean(p.default) : value !== 0}
              onChange={(e) => stage.set(ITEM, p.name, e.currentTarget.checked ? 1 : 0)}
            />
          );
        const d = Number(p.default);
        const span = Math.max(1, Math.abs(d) * 2);
        return (
          <Slider
            key={p.name}
            label={p.name}
            min={Math.min(0, -span)}
            max={span}
            step={p.type === "int" ? 1 : span / 100}
            showValue
            value={Number.isNaN(value) ? d : value}
            formatValue={(x) => (p.type === "int" ? String(x) : x.toFixed(2))}
            onChange={(x) => stage.set(ITEM, p.name, typeof x === "number" ? x : x[0])}
          />
        );
      })}
      <h3 className="t-mono dim fg-bpv-head">Machines</h3>
      {scene.machines.length === 0 ? <p className="t-small dim">None.</p> : null}
      {scene.machines.map((m, i) => (
        <p key={m.name} className="t-mono fg-bpv-row" data-machine={m.name}>
          <span className="dim">{m.name}</span> {states.split("\u0000")[i] || "—"}
        </p>
      ))}
      <h3 className="t-mono dim fg-bpv-head">Hover</h3>
      <p className="t-mono fg-bpv-row" data-hover="">
        {hover ? hover.tag || "(untagged)" : "—"}
      </p>
    </div>
  );
}

function Stats({ stage }: { stage: BlueprintStage }) {
  const text = useStage(stage, () => {
    const s = stage.stats;
    return `${stage.compositorKind ?? "—"} · ${s.refits} refits · ${s.frames} frames · ${s.composites} draws · engine ${s.frameMs.toFixed(1)} ms · draw ${s.composeMs.toFixed(1)} ms`;
  });
  return <p className="t-mono dim fg-bpv-stats">{text}</p>;
}
