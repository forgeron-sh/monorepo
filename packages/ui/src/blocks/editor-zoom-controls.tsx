// Zoom out, the zoom as a percent that opens a menu (presets, fit, fill, 100%), zoom in. The
// canvas owns the zoom and what "fit" means; this only asks. Shortcut hints are shown on the
// buttons and in the menu, and can be bound on the page.

import { MinusIcon, PlusIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { cx } from "../cx";
import { formatShortcut, useShortcuts } from "../hooks/use-shortcuts";
import { Icon } from "../icon";
import { Tooltip } from "../tooltip";
import {
  EDITOR_ZOOM_MAX,
  EDITOR_ZOOM_MIN,
  editorClampZoom,
  editorStepZoom,
  editorZoomText,
} from "./editor-model";
import { ActionMenu, type ActionMenuEntry } from "../action-menu";

export interface ZoomShortcuts {
  zoomIn?: string;
  zoomOut?: string;
  reset?: string;
  fit?: string;
  fill?: string;
}

const DEFAULT_SHORTCUTS: Required<ZoomShortcuts> = {
  zoomIn: "mod+=",
  zoomOut: "mod+-",
  reset: "mod+0",
  fit: "shift+1",
  fill: "shift+2",
};

// Shift and a digit types another character on most keyboards: the key to listen for.
const SHIFTED: Readonly<Record<string, string>> = { "shift+1": "shift+!", "shift+2": "shift+@" };

export interface ZoomControlsProps {
  /** The zoom, 1 = 100%. */
  zoom: number;
  onZoomChange: (zoom: number) => void;
  /** Adds "Zoom to fit" to the menu; the canvas works out the zoom (and the position). */
  onFit?: () => void;
  /** Adds "Zoom to fill". */
  onFill?: () => void;
  /** The zooms offered in the menu. Default 25%, 50%, 100%, 200%. */
  presets?: ReadonlyArray<number>;
  min?: number;
  max?: number;
  /** The steps of the + and − buttons; see `EDITOR_ZOOM_STEPS`. */
  steps?: ReadonlyArray<number>;
  /** The keys shown, and bound when `bindShortcuts` is on. */
  shortcuts?: ZoomShortcuts;
  /** Binds the shortcuts on the page. Default `false`: a canvas often has its own wheel and keys. */
  bindShortcuts?: boolean;
  /** Reads ⌘ (`true`) or Ctrl (`false`) in the hints. Default: from the platform. */
  mac?: boolean;
  /** Names the group: "Zoom". */
  label?: string;
  /** More controls after the zoom in button. */
  children?: ReactNode;
  className?: string;
}

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

/** Zoom out, the percent with its menu, zoom in. */
export function ZoomControls({
  zoom,
  onZoomChange,
  onFit,
  onFill,
  presets = [0.25, 0.5, 1, 2],
  min = EDITOR_ZOOM_MIN,
  max = EDITOR_ZOOM_MAX,
  steps,
  shortcuts,
  bindShortcuts = false,
  mac = isMac(),
  label = "Zoom",
  children,
  className,
}: ZoomControlsProps) {
  const keys = { ...DEFAULT_SHORTCUTS, ...shortcuts };
  const hint = (combo: string) => formatShortcut(combo, { mac });
  const current = editorClampZoom(zoom, min, max);
  const atMin = current <= min + 1e-9;
  const atMax = current >= max - 1e-9;
  const step = (way: 1 | -1) => onZoomChange(editorStepZoom(current, way, steps, min, max));
  const set = (z: number) => onZoomChange(editorClampZoom(z, min, max));

  const run = (id: string) => {
    if (id === "in") step(1);
    else if (id === "out") step(-1);
    else if (id === "reset") set(1);
    else if (id === "fit") onFit?.();
    else if (id === "fill") onFill?.();
    else if (id.startsWith("preset:")) set(Number(id.slice(7)));
  };

  const bindings: Record<string, () => void> = {
    [keys.zoomIn]: () => run("in"),
    [keys.zoomOut]: () => run("out"),
    [keys.reset]: () => run("reset"),
  };
  if (keys.zoomIn === "mod+=") bindings["mod++"] = () => run("in");
  if (onFit) {
    bindings[keys.fit] = () => run("fit");
    const alias = SHIFTED[keys.fit];
    if (alias) bindings[alias] = () => run("fit");
  }
  if (onFill) {
    bindings[keys.fill] = () => run("fill");
    const alias = SHIFTED[keys.fill];
    if (alias) bindings[alias] = () => run("fill");
  }
  useShortcuts(bindings, { enabled: bindShortcuts });

  const items: ActionMenuEntry[] = [
    { id: "in", label: "Zoom in", kbd: hint(keys.zoomIn), disabled: atMax },
    { id: "out", label: "Zoom out", kbd: hint(keys.zoomOut), disabled: atMin },
    { separator: true },
    ...presets.map((p) => ({
      id: `preset:${p}`,
      label: editorZoomText(p),
      checked: Math.abs(p - current) < 1e-6,
    })),
    { separator: true },
    ...(onFit ? [{ id: "fit", label: "Zoom to fit", kbd: hint(keys.fit) }] : []),
    ...(onFill ? [{ id: "fill", label: "Zoom to fill", kbd: hint(keys.fill) }] : []),
    { id: "reset", label: "Reset to 100%", kbd: hint(keys.reset) },
  ];

  return (
    <div role="group" aria-label={label} className={cx("fg-edt-zoom", className)}>
      <Tooltip content="Zoom out" kbd={hint(keys.zoomOut).join(" ")}>
        <button
          type="button"
          aria-label="Zoom out"
          aria-keyshortcuts="Control+- Meta+-"
          disabled={atMin}
          onClick={() => run("out")}
          className="fg-edt-zbtn"
        >
          <Icon icon={MinusIcon} size={12} variant="mono" />
        </button>
      </Tooltip>
      <ActionMenu
        label={`${label} options`}
        items={items}
        onSelect={run}
        align="center"
        side="top"
        trigger={
          <button
            type="button"
            aria-label={`${label} ${editorZoomText(current)}, open zoom menu`}
            className="fg-edt-zvalue"
          >
            {editorZoomText(current)}
          </button>
        }
      />
      <Tooltip content="Zoom in" kbd={hint(keys.zoomIn).join(" ")}>
        <button
          type="button"
          aria-label="Zoom in"
          aria-keyshortcuts="Control+= Meta+="
          disabled={atMax}
          onClick={() => run("in")}
          className="fg-edt-zbtn"
        >
          <Icon icon={PlusIcon} size={12} variant="mono" />
        </button>
      </Tooltip>
      {children}
    </div>
  );
}
