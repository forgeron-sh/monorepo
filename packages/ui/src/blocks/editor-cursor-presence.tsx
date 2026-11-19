// The other people in an editor: their cursors with a name, and what they have selected outlined
// with their name on it. The name is always written, so the colour never carries the meaning. A
// cursor moves in steps rather than gliding, and not at all with reduced motion.

import type { CSSProperties } from "react";
import { cx } from "../cx";
import {
  editorPresenceTone,
  editorProject,
  type EditorPoint,
  type EditorRect,
  type EditorView,
} from "./editor-model";

export interface EditorCursor {
  id: string;
  name: string;
  /** `#RRGGBB`. Without it a colour is picked from the id. */
  color?: string;
  /** The pointer, in world units (or screen pixels when no `view` is given). Absent: only a selection. */
  x?: number;
  y?: number;
  /** What they have selected, in the same units. */
  selection?: EditorRect;
  /** A word after the name: "typing", "drawing". */
  status?: string;
}

export interface CursorPresenceProps {
  /** Names the layer for assistive technology: "People here". */
  label: string;
  cursors: ReadonlyArray<EditorCursor>;
  /** What the canvas shows, to turn world positions into screen ones. */
  view?: EditorView;
  /** Writes who is here as a list that only assistive technology reads. Default `true`. */
  announce?: boolean;
  className?: string;
}

// The cursor is drawn as pixels: rows of a width, from the tip down, then the tail.
const ARROW: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 1],
  [0, 1, 2],
  [0, 2, 3],
  [0, 3, 4],
  [0, 4, 5],
  [0, 5, 6],
  [0, 6, 7],
  [0, 7, 4],
  [0, 8, 2],
  [3, 8, 2],
  [0, 9, 1],
  [3, 9, 2],
  [3, 10, 2],
];

function Arrow({ color }: { color: string }) {
  return (
    <svg
      className="fg-edt-cursor-arrow"
      width={18}
      height={26}
      viewBox="-1 -1 9 13"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g className="fg-edt-cursor-edge">
        {[
          [-0.5, 0],
          [0.5, 0],
          [0, -0.5],
          [0, 0.5],
        ].map(([dx, dy], i) => (
          <g key={i} transform={`translate(${dx} ${dy})`}>
            {ARROW.map(([x, y, w]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} />
            ))}
          </g>
        ))}
      </g>
      <g fill={color}>
        {ARROW.map(([x, y, w]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} />
        ))}
      </g>
    </svg>
  );
}

/** Remote cursors and selections over a canvas. Lay it over the canvas: it takes no clicks. */
export function CursorPresence({
  label,
  cursors,
  view,
  announce = true,
  className,
}: CursorPresenceProps) {
  const at = (p: EditorPoint): EditorPoint => (view ? editorProject(p, view) : p);
  return (
    <div className={cx("fg-edt-presence", className)} aria-hidden={announce ? undefined : "true"}>
      {announce ? (
        <ul className="fg-visually-hidden" aria-label={label}>
          {cursors.map((c) => (
            <li key={c.id}>
              {c.name}
              {c.status ? `, ${c.status}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      <div aria-hidden="true">
        {cursors.map((c) => {
          const tone = editorPresenceTone(c.id, c.color);
          const style = { "--edt-who": tone.color, "--edt-who-ink": tone.ink } as CSSProperties;
          const sel = c.selection
            ? (() => {
                const a = at(c.selection);
                const z = view?.zoom ?? 1;
                return { x: a.x, y: a.y, w: c.selection.w * z, h: c.selection.h * z };
              })()
            : null;
          const p = c.x !== undefined && c.y !== undefined ? at({ x: c.x, y: c.y }) : null;
          return (
            <div key={c.id} style={style}>
              {sel ? (
                <div
                  className="fg-edt-sel"
                  style={{
                    transform: `translate(${sel.x}px, ${sel.y}px)`,
                    width: sel.w,
                    height: sel.h,
                  }}
                >
                  <span className="fg-edt-who fg-edt-who-sel">{c.name}</span>
                </div>
              ) : null}
              {p ? (
                <div
                  className="fg-edt-cursor"
                  style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                >
                  <Arrow color={tone.color} />
                  <span className="fg-edt-who">
                    {c.name}
                    {c.status ? <span className="fg-edt-who-status"> · {c.status}</span> : null}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
