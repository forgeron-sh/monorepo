// Zoom out, the zoom as a percent that opens a menu (presets, fit, fill, 100%), zoom in. The
// canvas owns the zoom and what "fit" means; this only asks. Shortcut hints are shown on the
// buttons and in the menu, and can be bound on the page.
//
// `ZoomControls` alone builds the usual bar. With one of the parts among its children it is the root:
//
//   <ZoomControls zoom={z} onZoomChange={setZ} onFit={fit}>
//     <ZoomControlsOut /> <ZoomControlsValue /> <ZoomControlsIn />
//   </ZoomControls>
//
// Any other children are more controls, after zoom in.

import { MinusIcon, PlusIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { formatShortcut, useShortcuts } from "../hooks/use-shortcuts";
import { Icon } from "../icon";
import { hasPart, renderPart, type Part } from "../part";
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

export interface ZoomControlsProps extends Part<Omit<ComponentProps<"div">, "children">> {
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
  /** The parts of the bar, or, with none of them, more controls after zoom in. */
  children?: ReactNode;
}

interface ZoomContext {
  label: string;
  current: number;
  atMin: boolean;
  atMax: boolean;
  keys: Required<ZoomShortcuts>;
  hint: (combo: string) => string[];
  run: (id: string) => void;
  presets: ReadonlyArray<number>;
  hasFit: boolean;
  hasFill: boolean;
}

const Ctx = createContext<ZoomContext | null>(null);

function useZoom(part: string): ZoomContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <ZoomControls>.`);
  return ctx;
}

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

/** Zoom out, the percent with its menu, zoom in. Give it parts to arrange them yourself. */
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
  ...rest
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

  const ctx: ZoomContext = {
    label,
    current,
    atMin,
    atMax,
    keys,
    hint,
    run,
    presets,
    hasFit: onFit !== undefined,
    hasFill: onFill !== undefined,
  };

  return (
    <Ctx.Provider value={ctx}>
      <div
        role="group"
        aria-label={label}
        data-slot="zoom-controls"
        {...rest}
        className={cx("fg-edt-zoom", className)}
      >
        {hasPart(children, PARTS) ? (
          children
        ) : (
          <>
            <ZoomControlsOut />
            <ZoomControlsValue />
            <ZoomControlsIn />
            {children}
          </>
        )}
      </div>
    </Ctx.Provider>
  );
}

export type ZoomControlsButtonProps = Part<ComponentProps<"button">> & { asChild?: boolean };

/** Zoom out one step. */
export function ZoomControlsOut({
  asChild,
  className,
  children,
  ...rest
}: ZoomControlsButtonProps) {
  const z = useZoom("ZoomControlsOut");
  return (
    <Tooltip content="Zoom out" kbd={z.hint(z.keys.zoomOut).join(" ")}>
      {
        renderPart("button", cx("fg-edt-zbtn", className), asChild, {
          type: "button",
          "aria-label": "Zoom out",
          "aria-keyshortcuts": "Control+- Meta+-",
          "data-slot": "zoom-controls-out",
          disabled: z.atMin,
          onClick: () => z.run("out"),
          ...rest,
          children: children ?? <Icon icon={MinusIcon} size={12} variant="mono" />,
        }) as ReactElement
      }
    </Tooltip>
  );
}

/** Zoom in one step. */
export function ZoomControlsIn({ asChild, className, children, ...rest }: ZoomControlsButtonProps) {
  const z = useZoom("ZoomControlsIn");
  return (
    <Tooltip content="Zoom in" kbd={z.hint(z.keys.zoomIn).join(" ")}>
      {
        renderPart("button", cx("fg-edt-zbtn", className), asChild, {
          type: "button",
          "aria-label": "Zoom in",
          "aria-keyshortcuts": "Control+= Meta+=",
          "data-slot": "zoom-controls-in",
          disabled: z.atMax,
          onClick: () => z.run("in"),
          ...rest,
          children: children ?? <Icon icon={PlusIcon} size={12} variant="mono" />,
        }) as ReactElement
      }
    </Tooltip>
  );
}

/** The zoom as a percent; it opens the menu of presets, fit, fill and 100%. */
export function ZoomControlsValue({
  asChild,
  className,
  children,
  ...rest
}: ZoomControlsButtonProps) {
  const z = useZoom("ZoomControlsValue");
  const items: ActionMenuEntry[] = [
    { id: "in", label: "Zoom in", kbd: z.hint(z.keys.zoomIn), disabled: z.atMax },
    { id: "out", label: "Zoom out", kbd: z.hint(z.keys.zoomOut), disabled: z.atMin },
    { separator: true },
    ...z.presets.map((p) => ({
      id: `preset:${p}`,
      label: editorZoomText(p),
      checked: Math.abs(p - z.current) < 1e-6,
    })),
    { separator: true },
    ...(z.hasFit ? [{ id: "fit", label: "Zoom to fit", kbd: z.hint(z.keys.fit) }] : []),
    ...(z.hasFill ? [{ id: "fill", label: "Zoom to fill", kbd: z.hint(z.keys.fill) }] : []),
    { id: "reset", label: "Reset to 100%", kbd: z.hint(z.keys.reset) },
  ];
  return (
    <ActionMenu
      label={`${z.label} options`}
      items={items}
      onSelect={z.run}
      align="center"
      side="top"
      trigger={
        renderPart("button", cx("fg-edt-zvalue", className), asChild, {
          type: "button",
          "aria-label": `${z.label} ${editorZoomText(z.current)}, open zoom menu`,
          "data-slot": "zoom-controls-value",
          ...rest,
          children: children ?? editorZoomText(z.current),
        }) as ReactElement
      }
    />
  );
}

const PARTS: ReadonlyArray<unknown> = [ZoomControlsOut, ZoomControlsValue, ZoomControlsIn];
