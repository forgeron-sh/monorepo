// shadcn's Command parts (D-156), without `cmdk`: the query, the highlighted row and the keyboard
// live here in a React context. The focus stays in the input; the list is a listbox driven by
// `aria-activedescendant`, as in `CommandPalette` (command-palette.tsx, built from these parts). The terminal line is `CommandLine`.

import { Search01Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import type { DialogRootProps } from "./dialog";
import { Icon } from "./icon";

interface CommandContext {
  query: string;
  setQuery: (query: string) => void;
  active: string | null;
  setActive: (id: string | null) => void;
  /** How many rows are drawn (after filtering). */
  count: number;
  shouldFilter: boolean;
  listId: string;
}

const Context = createContext<CommandContext | null>(null);

function useCommand(part: string): CommandContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error(`${part} must be inside <Command>`);
  return ctx;
}

const ITEM = "[data-fg-cmd-item]";
const ENABLED = `${ITEM}:not([aria-disabled="true"])`;

export type CommandProps = HTMLAttributes<HTMLDivElement> & {
  /** `false`: show every row, whatever the query (you filter yourself). Default `true`. */
  shouldFilter?: boolean;
  /** Arrows wrap around at both ends. Default `true`. */
  loop?: boolean;
};

/** The root: the search field, the list and the keyboard. Inline, or in `CommandDialog`. */
export function Command({
  shouldFilter = true,
  loop = true,
  className,
  onKeyDown,
  children,
  ...rest
}: CommandProps) {
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // After each render: count the rows drawn and keep the highlight on one that is still there.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setCount(el.querySelectorAll(ITEM).length);
    const enabled = [...el.querySelectorAll<HTMLElement>(ENABLED)];
    if (!enabled.some((item) => item.id === active)) setActive(enabled[0]?.id ?? null);
  }, [query, active, children]);

  const move = (to: "next" | "prev" | "first" | "last") => {
    const el = root.current;
    if (!el) return;
    const enabled = [...el.querySelectorAll<HTMLElement>(ENABLED)];
    if (enabled.length === 0) return;
    const at = enabled.findIndex((item) => item.id === active);
    let index = 0;
    if (to === "last") index = enabled.length - 1;
    else if (to === "next") index = at + 1 >= enabled.length ? (loop ? 0 : at) : at + 1;
    else if (to === "prev") index = at <= 0 ? (loop ? enabled.length - 1 : 0) : at - 1;
    const next = enabled[index]!;
    setActive(next.id);
    next.scrollIntoView?.({ block: "nearest" });
  };

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "ArrowDown") move("next");
    else if (event.key === "ArrowUp") move("prev");
    else if (event.key === "Home") move("first");
    else if (event.key === "End") move("last");
    else if (event.key === "Enter") {
      if (event.nativeEvent.isComposing) return;
      const row = active ? root.current?.querySelector<HTMLElement>(`[id="${active}"]`) : null;
      row?.click();
    } else return;
    event.preventDefault();
  };

  return (
    <Context.Provider value={{ query, setQuery, active, setActive, count, shouldFilter, listId }}>
      <div {...rest} ref={root} className={cx("fg-cmdk", className)} onKeyDown={keyDown}>
        {children}
      </div>
    </Context.Provider>
  );
}

export type CommandInputProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value?: string;
  onValueChange?: (value: string) => void;
  /** After the field, in the head: the shortcut that opens the palette, a `Kbd`. */
  end?: ReactNode;
};

/** The search field, with its magnifier. Typing filters the rows. */
export function CommandInput({
  className,
  value,
  onValueChange,
  end,
  placeholder = "Search…",
  ...rest
}: CommandInputProps) {
  const ctx = useCommand("CommandInput");
  const shown = value ?? ctx.query;
  return (
    <div className="fg-palette-head">
      <Icon icon={Search01Icon} size={12} variant="mono" className="fg-palette-glass" />
      <input
        aria-label={placeholder}
        {...rest}
        className={cx("fg-palette-input", className)}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={ctx.listId}
        aria-autocomplete="list"
        {...(ctx.active ? { "aria-activedescendant": ctx.active } : {})}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        value={shown}
        onChange={(event) => {
          ctx.setQuery(event.target.value);
          onValueChange?.(event.target.value);
        }}
      />
      {end}
    </div>
  );
}

/** The rows, scrolling. */
export function CommandList({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ctx = useCommand("CommandList");
  return (
    <div
      role="listbox"
      aria-label="Results"
      {...rest}
      id={ctx.listId}
      className={cx("fg-palette-list", className)}
    />
  );
}

/** Drawn only while no row matches. */
export function CommandEmpty({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ctx = useCommand("CommandEmpty");
  if (ctx.count > 0) return null;
  return (
    <div role="presentation" {...rest} className={cx("fg-palette-empty", className)}>
      {children}
    </div>
  );
}

export type CommandGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** The mono heading above the rows. */
  heading?: ReactNode;
};

/** Rows under a heading; hidden when the filter leaves it none. */
export function CommandGroup({ heading, className, children, ...rest }: CommandGroupProps) {
  const id = useId();
  return (
    <div
      role="group"
      {...(heading ? { "aria-labelledby": id } : {})}
      {...rest}
      className={cx("fg-cmdk-group", className)}
    >
      {heading ? (
        <div className="fg-palette-group" id={id} role="presentation">
          {heading}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** A line between groups; hidden while a query is typed. */
export function CommandSeparator({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ctx = useCommand("CommandSeparator");
  if (ctx.shouldFilter && ctx.query.trim() !== "") return null;
  return <div role="separator" {...rest} className={cx("fg-pop-sep", className)} />;
}

export type CommandItemProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  /** What `onSelect` gets and what the query matches; the text of the row by default. */
  value?: string;
  /** Called with the value on a click or Enter. */
  onSelect?: (value: string) => void;
  disabled?: boolean;
  /** Other words that find the row. */
  keywords?: ReadonlyArray<string>;
};

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return (node as ReactNode[]).map(textOf).join(" ");
  if (typeof node === "object" && "props" in node) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

/** A row. Arrows highlight it, a click or Enter runs `onSelect`. */
export function CommandItem({
  value,
  onSelect,
  disabled,
  keywords,
  className,
  children,
  onClick,
  onMouseMove,
  ...rest
}: CommandItemProps) {
  const ctx = useCommand("CommandItem");
  const id = useId();
  const text = textOf(children).trim();
  const own = value ?? text;
  const words = ctx.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (ctx.shouldFilter && words.length > 0) {
    const haystack = [own, text, ...(keywords ?? [])].join(" ").toLowerCase();
    if (!words.every((w) => haystack.includes(w))) return null;
  }
  const on = ctx.active === id;
  return (
    <div
      {...rest}
      id={id}
      role="option"
      data-fg-cmd-item=""
      aria-selected={on}
      aria-disabled={disabled ? true : undefined}
      {...(disabled ? { "data-disabled": "" } : {})}
      {...(on ? { "data-highlighted": "" } : {})}
      className={cx("fg-pop-row fg-palette-row", className)}
      onMouseMove={(event) => {
        onMouseMove?.(event);
        if (!disabled && !on) ctx.setActive(id);
      }}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        onClick?.(event);
        if (!disabled) onSelect?.(own);
      }}
    >
      {children}
    </div>
  );
}

/** A shortcut at the end of a row, in mono. */
export function CommandShortcut({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} className={cx("fg-pop-hint", className)} />;
}

export type CommandDialogProps = Omit<DialogRootProps, "title" | "children"> & {
  children?: ReactNode;
  /** Read by assistive technology, not drawn. */
  title?: string;
  description?: string;
  className?: string;
  /** Default `false`, as the palette closes on Escape. */
  showCloseButton?: boolean;
};

/** A `Command` in a dialog (on the Dialog parts): `open`, `onOpenChange`, Escape and focus trap. */
export function CommandDialog({
  title = "Command palette",
  description = "Search for a command to run.",
  className,
  showCloseButton = false,
  children,
  ...props
}: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className={cx("fg-cmd-dialog", className)} showCloseButton={showCloseButton}>
        <DialogHeader className="fg-cmdk-sr">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
