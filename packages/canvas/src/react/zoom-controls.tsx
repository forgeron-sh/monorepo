// <ZoomControls>: the bar in a corner of the surface, built from the atoms of `@forgeron/ui`: the
// select and hand tools (Segmented), zoom out, the zoom level (back to 100 %), zoom in, fit, and
// optionally undo and redo. Each button names its key in a tooltip. <CanvasShortcuts> lists the keys.

import {
  Cursor01Icon,
  HandGrabIcon,
  Maximize01Icon,
  MinusSignIcon,
  PlusSignIcon,
  Redo02Icon,
  Undo02Icon,
} from "@forgeron/icons";
import { memo } from "react";
import { formatShortcut, Icon, IconButton, Kbd, Segmented, Tooltip } from "@forgeron/ui";
import { CANVAS_KEYMAP, type CanvasCommand } from "../core/keymap";
import { PAN_TOOL, SELECT_TOOL } from "../core/tools";
import { stepZoom, zoomAt } from "../core/viewport";
import { useCanvasContext, useCanvasState } from "./context";
import { animateViewport } from "./motion";

export interface ZoomControlsProps {
  /** Shows the select and hand tools. */
  tools?: boolean;
  /** Shows undo and redo. */
  history?: boolean;
  /** Fit keeps at most this zoom; 1 by default. */
  fitMaxZoom?: number;
  className?: string;
}

/**
 * Memoised: it is a child the editor creates again at each of its renders (a drag re-renders the
 * editor every step), and it reads what it shows from the store.
 */
export const ZoomControls = memo(function ZoomControls({
  tools = true,
  history = false,
  fitMaxZoom = 1,
  className,
}: ZoomControlsProps) {
  const store = useCanvasContext();
  const zoom = useCanvasState(store, (s) => s.viewport.zoom);
  const tool = useCanvasState(store, (s) => s.tool);
  const canUndo = useCanvasState(store, (s) => s.canUndo);
  const canRedo = useCanvasState(store, (s) => s.canRedo);
  const center = () => {
    const { size } = store.getState();
    return { x: size.w / 2, y: size.h / 2 };
  };
  const glideZoom = (z: number) =>
    animateViewport(store, zoomAt(store.getState().viewport, z, center(), store.zoomLimits));
  const percent = `${Math.round(zoom * 100)}%`;

  return (
    <div
      className={["fg-canvas-zoom", className].filter(Boolean).join(" ")}
      role="toolbar"
      aria-label="Canvas view"
    >
      {tools ? (
        <Segmented
          label="Tool"
          iconOnly
          value={tool === PAN_TOOL ? PAN_TOOL : SELECT_TOOL}
          onChange={(t) => store.setTool(t)}
          options={[
            {
              value: SELECT_TOOL,
              label: <Icon icon={Cursor01Icon} size={12} variant="mono" />,
              ariaLabel: "Select (V)",
            },
            {
              value: PAN_TOOL,
              label: <Icon icon={HandGrabIcon} size={12} variant="mono" />,
              ariaLabel: "Hand (H)",
            },
          ]}
        />
      ) : null}
      <div className="fg-canvas-zoom-group">
        <Tooltip content="Zoom out" kbd="−">
          <IconButton
            icon={MinusSignIcon}
            label="Zoom out"
            disabled={zoom <= store.zoomLimits.min}
            onClick={() =>
              glideZoom(stepZoom(store.getState().viewport.zoom, -1, store.zoomLimits))
            }
          />
        </Tooltip>
        <Tooltip content="Zoom to 100 %" kbd="0">
          <button
            type="button"
            className="fg-canvas-zoom-value"
            aria-label={`Zoom ${percent}, reset to 100 %`}
            onClick={() => glideZoom(1)}
          >
            {percent}
          </button>
        </Tooltip>
        <Tooltip content="Zoom in" kbd="=">
          <IconButton
            icon={PlusSignIcon}
            label="Zoom in"
            disabled={zoom >= store.zoomLimits.max}
            onClick={() => glideZoom(stepZoom(store.getState().viewport.zoom, 1, store.zoomLimits))}
          />
        </Tooltip>
        <Tooltip content="Zoom to fit" kbd="1">
          <IconButton
            icon={Maximize01Icon}
            label="Zoom to fit"
            onClick={() => animateViewport(store, store.fitViewport({ maxZoom: fitMaxZoom }))}
          />
        </Tooltip>
      </div>
      {history && !store.readOnly ? (
        <div className="fg-canvas-zoom-group">
          <Tooltip content="Undo" kbd="⌘Z">
            <IconButton
              icon={Undo02Icon}
              label="Undo"
              disabled={!canUndo}
              onClick={() => store.undo()}
            />
          </Tooltip>
          <Tooltip content="Redo" kbd="⇧⌘Z">
            <IconButton
              icon={Redo02Icon}
              label="Redo"
              disabled={!canRedo}
              onClick={() => store.redo()}
            />
          </Tooltip>
        </div>
      ) : null}
    </div>
  );
});

export interface CanvasShortcutsProps {
  /** The commands to list, in this order; every one by default. */
  commands?: ReadonlyArray<CanvasCommand>;
  /** Reads `mod` as ⌘ (default) or Ctrl. */
  mac?: boolean;
  className?: string;
}

/** The keys of the canvas as a list of `Kbd` caps and what they do: for a help popover. */
export function CanvasShortcuts({ commands, mac = true, className }: CanvasShortcutsProps) {
  const seen = new Set<CanvasCommand>();
  const rows = CANVAS_KEYMAP.filter((b) => {
    if (commands && !commands.includes(b.command)) return false;
    if (seen.has(b.command)) return false;
    seen.add(b.command);
    return true;
  });
  if (commands) rows.sort((a, b) => commands.indexOf(a.command) - commands.indexOf(b.command));
  return (
    <dl className={["fg-canvas-keys", className].filter(Boolean).join(" ")}>
      {rows.map((b) => (
        <div key={b.command} className="fg-canvas-keys-row">
          <dt>{b.label}</dt>
          <dd>
            <Kbd keys={formatShortcut(b.combo, { mac })} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
