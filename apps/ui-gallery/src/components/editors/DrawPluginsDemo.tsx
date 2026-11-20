import { parseBoard, type DrawItem } from "@forgeron/draw";
import {
  alignPlugin,
  arrange,
  arrow,
  diamond,
  ellipse,
  eraser,
  frame,
  groups,
  inspector,
  lock,
  pen,
  rectangle,
  sticky,
  text,
  toolbar,
  type EditorPlugin,
} from "@forgeron/draw/plugins/editor";
import { DrawEditor, useDrawStore } from "@forgeron/draw/react";
import { Button } from "@forgeron/ui";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { star } from "./draw-star-plugin";

// Features come from plugins: the core is the canvas (select, move, resize, undo, zoom, pan); each
// button adds or removes a plugin, and a list of plugins is the whole configuration. The board holds
// an arrow and a frame whatever the list: with no plugin for them they stay in the JSON, drawn as
// labelled dashed boxes. `star` is defined in this gallery, in one file.
const GROUPS: ReadonlyArray<{ id: string; label: string; plugins: ReadonlyArray<EditorPlugin> }> = [
  { id: "shapes", label: "shapes", plugins: [rectangle, ellipse, diamond] },
  { id: "notes", label: "notes", plugins: [sticky, text] },
  { id: "pen", label: "pen", plugins: [pen, eraser] },
  { id: "arrow", label: "arrow", plugins: [arrow] },
  { id: "frame", label: "frame", plugins: [frame] },
  { id: "layout", label: "groups, lock, align", plugins: [groups, lock, alignPlugin, arrange] },
  { id: "star", label: "star (yours)", plugins: [star] },
];

const ALL_CORES = [...GROUPS.flatMap((g) => g.plugins), toolbar, inspector].map((p) => p.core);

const SEED = JSON.stringify({
  format: "forgeron/draw",
  version: 1,
  items: [
    {
      id: "frame-1",
      kind: "frame",
      bounds: { x: 0, y: 0, w: 560, h: 300 },
      z: 0,
      data: { type: "frame", name: "A frame" },
    },
    {
      id: "r1",
      kind: "rectangle",
      bounds: { x: 40, y: 80, w: 140, h: 80 },
      z: 1,
      data: {
        type: "shape",
        fill: { type: "none" },
        stroke: { color: "ink", width: 2, dash: "solid" },
        text: "Shape",
        frame: "frame-1",
      },
    },
    {
      id: "n1",
      kind: "sticky",
      bounds: { x: 300, y: 70, w: 160, h: 160 },
      z: 2,
      data: { type: "sticky", color: "amber", text: "A note", frame: "frame-1" },
    },
    {
      id: "a1",
      kind: "arrow",
      bounds: { x: 170, y: 100, w: 150, h: 60 },
      z: 3,
      data: {
        type: "arrow",
        start: { x: 20, y: 30, bind: "r1" },
        end: { x: 130, y: 30, bind: "n1" },
        head: "end",
        route: "straight",
        stroke: { color: "ink", width: 2, dash: "solid" },
        frame: "frame-1",
      },
    },
    {
      id: "s1",
      kind: "star",
      bounds: { x: 400, y: 340, w: 96, h: 96 },
      z: 4,
      data: { type: "star", points: 5 },
    },
  ],
});

export default function DrawPluginsDemo() {
  const [on, setOn] = useState<ReadonlySet<string>>(() => new Set(GROUPS.map((g) => g.id)));
  const plugins = useMemo<ReadonlyArray<EditorPlugin>>(
    () => [...GROUPS.filter((g) => on.has(g.id)).flatMap((g) => g.plugins), toolbar, inspector],
    [on],
  );
  // The store runs the same plugins' rules: it is rebuilt with the editor when the list changes.
  const key = useMemo(() => [...on].sort().join("+"), [on]);
  // What is on the board when the list changes goes with it (kept as JSON, unknown kinds included).
  const saved = useRef<string | null>(null);
  return (
    <div className="ed-rt-stack">
      <div className="ed-rt-bar" role="group" aria-label="Plugins">
        <Button size="sm" variant="secondary" onClick={() => setOn(new Set())}>
          Core only
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setOn(new Set(GROUPS.map((g) => g.id)))}
        >
          Everything
        </Button>
        {GROUPS.map((g) => (
          <Button
            key={g.id}
            size="sm"
            variant={on.has(g.id) ? "primary" : "secondary"}
            aria-pressed={on.has(g.id)}
            onClick={() =>
              setOn((now) => {
                const next = new Set(now);
                if (!next.delete(g.id)) next.add(g.id);
                return next;
              })
            }
          >
            {g.label}
          </Button>
        ))}
      </div>
      <p className="t-mono dim">plugins: core · {plugins.map((p) => p.core.id).join(" · ")}</p>
      <div className="ed-stage ed-stage-draw ticks">
        <Board key={key} plugins={plugins} saved={saved} />
      </div>
    </div>
  );
}

/** A board on the plugins' rules, holding the seed; the JSON survives what the list leaves out. */
function Board({
  plugins,
  saved,
}: {
  plugins: ReadonlyArray<EditorPlugin>;
  saved: RefObject<string | null>;
}) {
  const store = useDrawStore({ plugins });
  useEffect(() => {
    if (store.getState().items.length) return;
    const { items } = parseBoard(saved.current ?? SEED, ALL_CORES, { unknown: "keep" });
    store.replace(items as DrawItem[]);
    const fit = () => store.fitView({ padding: 32 });
    const keep = () => {
      saved.current = store.serialize();
    };
    if (store.getState().size.w) fit();
    else {
      const stop = store.subscribe(() => {
        if (!store.getState().size.w) return;
        stop();
        fit();
      });
      return () => {
        stop();
        keep();
      };
    }
    return keep;
  }, [store, saved]);
  return <DrawEditor store={store} plugins={plugins} label="Plugins" className="ed-draw" />;
}
