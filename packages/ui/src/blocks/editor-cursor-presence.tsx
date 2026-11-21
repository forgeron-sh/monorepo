// The other people in an editor: their cursors with a name, and what they have selected outlined
// with their name on it. The name is always written, so the colour never carries the meaning. A
// cursor moves in steps rather than gliding, and not at all with reduced motion.
//
// `CursorPresence` with no children draws everyone in `cursors`. With children it is the root of
// the parts:
//
//   <CursorPresence label="People here" cursors={cursors} view={view}>
//     <CursorPresenceList />
//     <div aria-hidden="true">
//       {cursors.map((c) => (
//         <CursorPresenceCursor key={c.id} cursor={c}>
//           <CursorPresenceSelection />
//           <CursorPresencePointer />
//         </CursorPresenceCursor>
//       ))}
//     </div>
//   </CursorPresence>

import {
  createContext,
  useContext,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import type { Part } from "../part";
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

export interface CursorPresenceProps extends Part<Omit<ComponentProps<"div">, "children">> {
  /** Names the layer for assistive technology: "People here". */
  label: string;
  cursors: ReadonlyArray<EditorCursor>;
  /** What the canvas shows, to turn world positions into screen ones. */
  view?: EditorView;
  /** Writes who is here as a list that only assistive technology reads. Default `true`. */
  announce?: boolean;
  /** The parts. Without them, the list, then each cursor with its selection and pointer. */
  children?: ReactNode;
}

interface PresenceContext {
  cursors: ReadonlyArray<EditorCursor>;
  label: string;
  view: EditorView | undefined;
  at: (p: EditorPoint) => EditorPoint;
}

const Ctx = createContext<PresenceContext | null>(null);

function usePresence(part: string): PresenceContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <CursorPresence>.`);
  return ctx;
}

const CursorCtx = createContext<EditorCursor | null>(null);

function useCursor(part: string): EditorCursor {
  const ctx = useContext(CursorCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <CursorPresenceCursor>.`);
  return ctx;
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
  children,
  className,
  ...rest
}: CursorPresenceProps) {
  const at = (p: EditorPoint): EditorPoint => (view ? editorProject(p, view) : p);
  return (
    <Ctx.Provider value={{ cursors, label, view, at }}>
      <div
        data-slot="cursor-presence"
        {...rest}
        className={cx("fg-edt-presence", className)}
        aria-hidden={announce ? undefined : "true"}
      >
        {children ?? (
          <>
            {announce ? <CursorPresenceList /> : null}
            <div aria-hidden="true">
              {cursors.map((c) => (
                <CursorPresenceCursor key={c.id} cursor={c}>
                  <CursorPresenceSelection />
                  <CursorPresencePointer />
                </CursorPresenceCursor>
              ))}
            </div>
          </>
        )}
      </div>
    </Ctx.Provider>
  );
}

/** Who is here, as a list only assistive technology reads. */
export function CursorPresenceList({
  className,
  ...rest
}: Part<Omit<ComponentProps<"ul">, "children">>) {
  const { cursors, label } = usePresence("CursorPresenceList");
  return (
    <ul
      aria-label={label}
      data-slot="cursor-presence-list"
      {...rest}
      className={cx("fg-visually-hidden", className)}
    >
      {cursors.map((c) => (
        <li key={c.id}>
          {c.name}
          {c.status ? `, ${c.status}` : ""}
        </li>
      ))}
    </ul>
  );
}

export type CursorPresenceCursorProps = Part<Omit<ComponentProps<"div">, "children">> & {
  cursor: EditorCursor;
  /** `CursorPresenceSelection` and `CursorPresencePointer`. */
  children?: ReactNode;
};

/** One person: gives its colour to the selection and the pointer inside. */
export function CursorPresenceCursor({
  cursor,
  className,
  style,
  children,
  ...rest
}: CursorPresenceCursorProps) {
  const tone = editorPresenceTone(cursor.id, cursor.color);
  return (
    <CursorCtx.Provider value={cursor}>
      <div
        data-slot="cursor-presence-cursor"
        {...rest}
        className={className}
        style={{ "--edt-who": tone.color, "--edt-who-ink": tone.ink, ...style } as CSSProperties}
      >
        {children}
      </div>
    </CursorCtx.Provider>
  );
}

/** What the person has selected, outlined, with their name. Nothing when they have no selection. */
export function CursorPresenceSelection({
  className,
  style,
  ...rest
}: Part<Omit<ComponentProps<"div">, "children">>) {
  const { at, view } = usePresence("CursorPresenceSelection");
  const c = useCursor("CursorPresenceSelection");
  if (!c.selection) return null;
  const a = at(c.selection);
  const z = view?.zoom ?? 1;
  return (
    <div
      data-slot="cursor-presence-selection"
      {...rest}
      className={cx("fg-edt-sel", className)}
      style={{
        transform: `translate(${a.x}px, ${a.y}px)`,
        width: c.selection.w * z,
        height: c.selection.h * z,
        ...style,
      }}
    >
      <span className="fg-edt-who fg-edt-who-sel">{c.name}</span>
    </div>
  );
}

/** The person's pointer, with their name and status. Nothing when they have no position. */
export function CursorPresencePointer({
  className,
  style,
  ...rest
}: Part<Omit<ComponentProps<"div">, "children">>) {
  const { at } = usePresence("CursorPresencePointer");
  const c = useCursor("CursorPresencePointer");
  if (c.x === undefined || c.y === undefined) return null;
  const p = at({ x: c.x, y: c.y });
  const tone = editorPresenceTone(c.id, c.color);
  return (
    <div
      data-slot="cursor-presence-pointer"
      {...rest}
      className={cx("fg-edt-cursor", className)}
      style={{ transform: `translate(${p.x}px, ${p.y}px)`, ...style }}
    >
      <Arrow color={tone.color} />
      <span className="fg-edt-who">
        {c.name}
        {c.status ? <span className="fg-edt-who-status"> · {c.status}</span> : null}
      </span>
    </div>
  );
}
