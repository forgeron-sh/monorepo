// The tool dock of a canvas-like editor: tools in groups, one active, tools with variants (a
// shape with its rectangle, ellipse and line), undo and redo. One tab stop, arrows move between
// tools (roving tabindex, from Toolbar); each tool's key picks it from anywhere on the page.
//
// `CanvasToolbar` alone builds the usual dock; its children go at the end. With one of the parts
// below among the children, the children are the dock:
//
//   <CanvasToolbar label="Tools" tools={tools} onUndo={undo} onRedo={redo}>
//     <CanvasToolbarTools />
//     <CanvasToolbarSeparator />
//     <CanvasToolbarUndo /> <CanvasToolbarRedo />
//   </CanvasToolbar>

import { ArrowDown01Icon, ArrowRight01Icon, RedoIcon, UndoIcon } from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";
import { createContext, Fragment, useContext, type ComponentProps, type ReactNode } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { formatShortcut, useShortcuts } from "../hooks/use-shortcuts";
import { Icon } from "../icon";
import { hasPart, type Part } from "../part";
import { Tooltip } from "../tooltip";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "../toolbar";
import { ActionMenu, type ActionMenuItem } from "../action-menu";

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

export interface CanvasToolbarProps extends Part<
  Omit<ComponentProps<"div">, "children" | "onChange" | "defaultValue">
> {
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
  /** More controls at the end of the dock: a mode switch, a menu. Or the parts of the dock. */
  children?: ReactNode;
}

interface DockContext {
  tools: ReadonlyArray<EditorTool>;
  active: string;
  vertical: boolean;
  tipSide: "right" | "bottom";
  mac: boolean;
  variantOf: (tool: EditorTool) => EditorToolVariant | undefined;
  pick: (tool: EditorTool, variant?: EditorToolVariant) => void;
  onUndo: (() => void) | undefined;
  onRedo: (() => void) | undefined;
  canUndo: boolean;
  canRedo: boolean;
}

const Ctx = createContext<DockContext | null>(null);

function useDock(part: string): DockContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <CanvasToolbar>.`);
  return ctx;
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
  ...rest
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
  const ctx: DockContext = {
    tools,
    active,
    vertical,
    tipSide: vertical ? "right" : "bottom",
    mac,
    variantOf,
    pick,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
  };

  const composed = hasPart(children, PARTS);
  const history = onUndo || onRedo;

  return (
    <Ctx.Provider value={ctx}>
      <div
        data-slot="canvas-toolbar"
        {...rest}
        className={cx("fg-edt-dock", floating && "fg-edt-floating", className)}
      >
        <Toolbar label={label} orientation={orientation} className="fg-edt-bar">
          {composed ? (
            children
          ) : (
            <>
              <CanvasToolbarTools />
              {history ? (
                <>
                  {tools.length > 0 ? <CanvasToolbarSeparator /> : null}
                  {onUndo ? <CanvasToolbarUndo /> : null}
                  {onRedo ? <CanvasToolbarRedo /> : null}
                </>
              ) : null}
              {children}
            </>
          )}
        </Toolbar>
      </div>
    </Ctx.Provider>
  );
}

/** Every tool, with a thin line between groups. */
export function CanvasToolbarTools() {
  const { tools } = useDock("CanvasToolbarTools");
  return (
    <>
      {tools.map((tool, i) => {
        const previous = tools[i - 1];
        return (
          <Fragment key={tool.id}>
            {previous && (previous.group ?? "") !== (tool.group ?? "") ? (
              <CanvasToolbarSeparator />
            ) : null}
            <CanvasToolbarTool tool={tool} />
          </Fragment>
        );
      })}
    </>
  );
}

/** One tool, with the menu of its variants when it has some. */
export function CanvasToolbarTool({
  tool,
  className,
  ...rest
}: Part<Omit<ComponentProps<typeof ToolbarButton>, "label" | "icon" | "pressed" | "children">> & {
  tool: EditorTool;
}) {
  const d = useDock("CanvasToolbarTool");
  const variant = d.variantOf(tool);
  const icon = variant?.icon ?? tool.icon;
  const name =
    variant && tool.variants && tool.variants.length > 1
      ? `${tool.label}, ${variant.label}`
      : tool.label;
  const on = d.active === tool.id;
  return (
    <>
      <Tooltip
        content={name}
        side={d.tipSide}
        {...(tool.shortcut ? { kbd: hint(tool.shortcut, d.mac) } : {})}
      >
        <ToolbarButton
          label={name}
          icon={icon}
          pressed={on}
          title={undefined}
          aria-keyshortcuts={tool.shortcut}
          disabled={tool.disabled}
          onClick={() => d.pick(tool)}
          data-slot="canvas-toolbar-tool"
          {...rest}
          className={cx("fg-edt-tool", className)}
        />
      </Tooltip>
      {tool.variants && tool.variants.length > 1 ? (
        <ActionMenu
          label={`${tool.label} variants`}
          side={d.vertical ? "right" : "bottom"}
          trigger={
            <ToolbarButton
              aria-label={`${tool.label} variants`}
              disabled={tool.disabled}
              data-slot="canvas-toolbar-variants"
              className={cx("fg-edt-more", on && "fg-edt-more-on")}
            >
              <Icon
                icon={d.vertical ? ArrowRight01Icon : ArrowDown01Icon}
                size={12}
                variant="mono"
              />
            </ToolbarButton>
          }
          items={tool.variants.map<ActionMenuItem>((v) => ({
            id: v.id,
            label: v.label,
            ...(v.icon ? { icon: v.icon } : {}),
            ...(v.shortcut ? { kbd: formatShortcut(v.shortcut, { mac: d.mac }) } : {}),
            checked: v.id === variant?.id,
          }))}
          onSelect={(id) => {
            const next = tool.variants?.find((v) => v.id === id);
            if (next) d.pick(tool, next);
          }}
        />
      ) : null}
    </>
  );
}

/** A thin line between two groups of tools. */
export function CanvasToolbarSeparator(props: ComponentProps<typeof ToolbarSeparator>) {
  return <ToolbarSeparator data-slot="canvas-toolbar-separator" {...props} />;
}

type HistoryProps = Part<Omit<ComponentProps<typeof ToolbarButton>, "label" | "icon" | "children">>;

/** Undo, bound to ⌘Z by the root. Needs the root's `onUndo`. */
export function CanvasToolbarUndo({ className, ...rest }: HistoryProps) {
  const d = useDock("CanvasToolbarUndo");
  return (
    <Tooltip content="Undo" side={d.tipSide} kbd={hint("mod+z", d.mac)}>
      <ToolbarButton
        label="Undo"
        icon={UndoIcon}
        title={undefined}
        aria-keyshortcuts="Control+Z Meta+Z"
        disabled={!d.canUndo}
        onClick={d.onUndo}
        data-slot="canvas-toolbar-undo"
        {...rest}
        className={cx("fg-edt-tool", className)}
      />
    </Tooltip>
  );
}

/** Redo, bound to ⇧⌘Z by the root. Needs the root's `onRedo`. */
export function CanvasToolbarRedo({ className, ...rest }: HistoryProps) {
  const d = useDock("CanvasToolbarRedo");
  return (
    <Tooltip content="Redo" side={d.tipSide} kbd={hint("mod+shift+z", d.mac)}>
      <ToolbarButton
        label="Redo"
        icon={RedoIcon}
        title={undefined}
        aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z"
        disabled={!d.canRedo}
        onClick={d.onRedo}
        data-slot="canvas-toolbar-redo"
        {...rest}
        className={cx("fg-edt-tool", className)}
      />
    </Tooltip>
  );
}

const PARTS: ReadonlyArray<unknown> = [
  CanvasToolbarTools,
  CanvasToolbarTool,
  CanvasToolbarSeparator,
  CanvasToolbarUndo,
  CanvasToolbarRedo,
];
