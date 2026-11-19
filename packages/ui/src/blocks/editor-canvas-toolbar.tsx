// The tool dock of a canvas-like editor: tools in groups, one active, tools with variants (a
// shape with its rectangle, ellipse and line), undo and redo. One tab stop, arrows move between
// tools (roving tabindex, from Toolbar); each tool's key picks it from anywhere on the page.

import { Toolbar as Base } from "@base-ui/react/toolbar";
import { ArrowDown01Icon, ArrowRight01Icon, RedoIcon, UndoIcon } from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";
import { Fragment, type ReactNode } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { formatShortcut, useShortcuts } from "../hooks/use-shortcuts";
import { Icon } from "../icon";
import { Tooltip } from "../overlays";
import { Toolbar } from "../toolbar";
import { ActionMenu, type ActionMenuItem } from "./navigation-action-menu";

export interface EditorToolVariant {
  id: string;
  label: string;
  icon?: IconDefinition;
  /** The key that picks this variant and its tool, e.g. `"shift+r"`. */
  shortcut?: string;
}

export interface EditorTool {
  id: string;
  /** Its name, said by assistive technology and shown in the tooltip: "Rectangle". */
  label: string;
  icon: IconDefinition;
  /** The key that picks the tool from anywhere on the page, e.g. `"v"`, `"shift+t"`. */
  shortcut?: string;
  /** Tools with the same group sit together; a thin line separates groups. */
  group?: string;
  /** Other forms of the tool, in a menu beside it. The one chosen gives its icon to the tool. */
  variants?: ReadonlyArray<EditorToolVariant>;
  disabled?: boolean;
}

export interface CanvasToolbarProps {
  /** Names the dock: "Drawing tools". */
  label: string;
  tools: ReadonlyArray<EditorTool>;
  /** The id of the active tool. */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** The variant chosen for each tool with variants: `{ shape: "ellipse" }`. */
  variants?: Readonly<Record<string, string>>;
  defaultVariants?: Readonly<Record<string, string>>;
  onVariantChange?: (toolId: string, variantId: string) => void;
  orientation?: "horizontal" | "vertical";
  /** Shows the undo and redo buttons at the end of the dock. */
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  /** Binds the tools' keys (and ⌘Z, ⇧⌘Z) on the page. Default `true`. */
  shortcuts?: boolean;
  /** Reads ⌘ and ⌥ (`true`) or Ctrl and Alt (`false`) in the hints. Default: from the platform. */
  mac?: boolean;
  /** Lifts the dock off the page with the shadow of a floating panel. */
  floating?: boolean;
  /** More controls at the end of the dock: a mode switch, a menu. */
  children?: ReactNode;
  className?: string;
}

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

const hint = (combo: string, mac: boolean) => formatShortcut(combo, { mac }).join(" ");

/** The tool dock of an editor: grouped tools, variants, an active tool, undo and redo. */
export function CanvasToolbar({
  label,
  tools,
  value,
  defaultValue,
  onChange,
  variants,
  defaultVariants,
  onVariantChange,
  orientation = "horizontal",
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true,
  shortcuts = true,
  mac = isMac(),
  floating,
  children,
  className,
}: CanvasToolbarProps) {
  const [active, setActive] = useControllableState<string>({
    ...(value !== undefined ? { value } : {}),
    defaultValue: defaultValue ?? tools[0]?.id ?? "",
    ...(onChange ? { onChange } : {}),
  });
  const [chosen, setChosen] = useControllableState<Readonly<Record<string, string>>>({
    ...(variants !== undefined ? { value: variants } : {}),
    defaultValue: defaultVariants ?? {},
  });

  const variantOf = (tool: EditorTool) =>
    tool.variants?.find((v) => v.id === chosen[tool.id]) ?? tool.variants?.[0];

  const pick = (tool: EditorTool, variant?: EditorToolVariant) => {
    if (tool.disabled) return;
    if (variant && variant.id !== variantOf(tool)?.id) {
      setChosen({ ...chosen, [tool.id]: variant.id });
      onVariantChange?.(tool.id, variant.id);
    }
    setActive(tool.id);
  };

  const bindings: Record<string, () => void> = {};
  for (const tool of tools) {
    if (tool.shortcut && !tool.disabled) bindings[tool.shortcut] = () => pick(tool);
    for (const v of tool.variants ?? [])
      if (v.shortcut && !tool.disabled) bindings[v.shortcut] = () => pick(tool, v);
  }
  if (onUndo && canUndo) bindings["mod+z"] = onUndo;
  if (onRedo && canRedo) {
    bindings["mod+shift+z"] = onRedo;
    bindings["mod+y"] = onRedo;
  }
  useShortcuts(bindings, { enabled: shortcuts });

  const vertical = orientation === "vertical";
  const tipSide = vertical ? "right" : "bottom";

  const entries: ReactNode[] = [];
  tools.forEach((tool, i) => {
    const previous = tools[i - 1];
    if (previous && (previous.group ?? "") !== (tool.group ?? "")) {
      entries.push(<Base.Separator key={`sep-${tool.id}`} className="fg-tool-sep" />);
    }
    const variant = variantOf(tool);
    const icon = variant?.icon ?? tool.icon;
    const name =
      variant && tool.variants && tool.variants.length > 1
        ? `${tool.label}, ${variant.label}`
        : tool.label;
    const on = active === tool.id;
    entries.push(
      <Fragment key={tool.id}>
        <Tooltip
          content={name}
          side={tipSide}
          {...(tool.shortcut ? { kbd: hint(tool.shortcut, mac) } : {})}
        >
          <Base.Button
            type="button"
            aria-label={name}
            aria-pressed={on}
            aria-keyshortcuts={tool.shortcut}
            disabled={tool.disabled}
            focusableWhenDisabled
            onClick={() => pick(tool)}
            className={cx("fg-tool fg-tool-icon fg-edt-tool", on && "fg-tool-on")}
          >
            <Icon icon={icon} size={12} variant="mono" />
          </Base.Button>
        </Tooltip>
        {tool.variants && tool.variants.length > 1 ? (
          <ActionMenu
            label={`${tool.label} variants`}
            side={vertical ? "right" : "bottom"}
            trigger={
              <Base.Button
                type="button"
                aria-label={`${tool.label} variants`}
                disabled={tool.disabled}
                focusableWhenDisabled
                className={cx("fg-tool fg-edt-more", on && "fg-edt-more-on")}
              >
                <Icon
                  icon={vertical ? ArrowRight01Icon : ArrowDown01Icon}
                  size={12}
                  variant="mono"
                />
              </Base.Button>
            }
            items={tool.variants.map<ActionMenuItem>((v) => ({
              id: v.id,
              label: v.label,
              ...(v.icon ? { icon: v.icon } : {}),
              ...(v.shortcut ? { kbd: formatShortcut(v.shortcut, { mac }) } : {}),
              checked: v.id === variant?.id,
            }))}
            onSelect={(id) => {
              const next = tool.variants?.find((v) => v.id === id);
              if (next) pick(tool, next);
            }}
          />
        ) : null}
      </Fragment>,
    );
  });

  const history = onUndo || onRedo;

  return (
    <div className={cx("fg-edt-dock", floating && "fg-edt-floating", className)}>
      <Toolbar label={label} orientation={orientation} className="fg-edt-bar">
        {entries}
        {history ? (
          <>
            {tools.length > 0 ? <Base.Separator className="fg-tool-sep" /> : null}
            {onUndo ? (
              <Tooltip content="Undo" side={tipSide} kbd={hint("mod+z", mac)}>
                <Base.Button
                  type="button"
                  aria-label="Undo"
                  aria-keyshortcuts="Control+Z Meta+Z"
                  disabled={!canUndo}
                  focusableWhenDisabled
                  onClick={onUndo}
                  className="fg-tool fg-tool-icon fg-edt-tool"
                >
                  <Icon icon={UndoIcon} size={12} variant="mono" />
                </Base.Button>
              </Tooltip>
            ) : null}
            {onRedo ? (
              <Tooltip content="Redo" side={tipSide} kbd={hint("mod+shift+z", mac)}>
                <Base.Button
                  type="button"
                  aria-label="Redo"
                  aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z"
                  disabled={!canRedo}
                  focusableWhenDisabled
                  onClick={onRedo}
                  className="fg-tool fg-tool-icon fg-edt-tool"
                >
                  <Icon icon={RedoIcon} size={12} variant="mono" />
                </Base.Button>
              </Tooltip>
            ) : null}
          </>
        ) : null}
        {children}
      </Toolbar>
    </div>
  );
}
