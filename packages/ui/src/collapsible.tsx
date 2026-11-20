// A section that folds (Collapsible) and a stack of them (Accordion). Base UI keeps the buttons,
// `aria-expanded`, `aria-controls` and, for the accordion, the arrow keys between headers.

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { Collapsible as Base } from "@base-ui/react/collapsible";
import { ArrowDown01Icon } from "@forgeron/icons";
import type { ComponentProps, ReactNode } from "react";
import { asChildProps } from "./as-child";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";

export interface CollapsibleProps {
  /** The button that folds and unfolds. */
  title: ReactNode;
  /** Mono text at the end of the header: a count, a state. */
  hint?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Keeps the content in the page while folded (hidden): a form keeps what was typed. */
  keepMounted?: boolean;
  /** `framed` (default): a frame and a header band. `plain`: a line only, for dense places. */
  variant?: "framed" | "plain";
  className?: string;
  children: ReactNode;
}

/**
 * With `title`: one section that folds, no animation under `prefers-reduced-motion`, a short one
 * otherwise. Without: the root of shadcn's parts (`CollapsibleTrigger`, `CollapsibleContent`), D-156.
 */
export function Collapsible(props: CollapsibleProps | CollapsibleRootProps) {
  return props.title !== undefined ? (
    <CollapsibleBox {...(props as CollapsibleProps)} />
  ) : (
    <CollapsibleRoot {...(props as CollapsibleRootProps)} />
  );
}

function CollapsibleBox({
  title,
  hint,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled,
  keepMounted,
  variant = "framed",
  className,
  children,
}: CollapsibleProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return (
    <Base.Root
      open={isOpen}
      onOpenChange={(next) => setOpen(next)}
      disabled={disabled}
      className={cx("fg-fold", variant === "plain" && "fg-fold-plain", className)}
    >
      <Base.Trigger className="fg-fold-trigger">
        <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-fold-caret" />
        <span className="fg-fold-title">{title}</span>
        {hint ? <span className="fg-fold-hint">{hint}</span> : null}
      </Base.Trigger>
      <Base.Panel className="fg-fold-panel" keepMounted={keepMounted}>
        <div className="fg-fold-body">{children}</div>
      </Base.Panel>
    </Base.Root>
  );
}

export interface AccordionItem {
  value: string;
  title: ReactNode;
  hint?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: ReadonlyArray<AccordionItem>;
  /** The values of the sections that are open. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Several sections open at once. Default `false`: opening one folds the other. */
  multiple?: boolean;
  /** The level of the headings, 1 to 6. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  disabled?: boolean;
  className?: string;
}

/**
 * With `items`: sections stacked, one open at a time or several; Up and Down move between the
 * headers. Without: the root of shadcn's parts (`AccordionItem`, `AccordionTrigger`…), D-156.
 */
export function Accordion(props: AccordionProps | AccordionRootProps) {
  return props.items !== undefined ? (
    <AccordionList {...(props as AccordionProps)} />
  ) : (
    <AccordionRoot {...(props as AccordionRootProps)} />
  );
}

function AccordionList({
  items,
  value,
  defaultValue = [],
  onChange,
  multiple = false,
  headingLevel = 3,
  disabled,
  className,
}: AccordionProps) {
  const [open, setOpen] = useControllableState<string[]>({ value, defaultValue, onChange });
  return (
    <BaseAccordion.Root
      value={open}
      onValueChange={(next) => setOpen(next as string[])}
      multiple={multiple}
      disabled={disabled}
      className={cx("fg-accordion", className)}
    >
      {items.map((item) => (
        <BaseAccordion.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className="fg-fold fg-fold-item"
        >
          <BaseAccordion.Header
            className="fg-fold-header"
            render={<div role="heading" aria-level={headingLevel} />}
          >
            <BaseAccordion.Trigger className="fg-fold-trigger">
              <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-fold-caret" />
              <span className="fg-fold-title">{item.title}</span>
              {item.hint ? <span className="fg-fold-hint">{item.hint}</span> : null}
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel className="fg-fold-panel">
            <div className="fg-fold-body">{item.content}</div>
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  );
}

/* ---------------------------------------------------------------- shadcn parts (D-156) */

// shadcn's Collapsible and Accordion parts (D-156), on Base UI (D-147).

type Part<T> = Omit<T, "className"> & { className?: string };

/** `title` stays undefined: with a title, `Collapsible` is the props-driven one. */
export type CollapsibleRootProps = Part<
  Omit<ComponentProps<typeof Base.Root>, "onOpenChange" | "title">
> & {
  title?: undefined;
  onOpenChange?: (open: boolean) => void;
};

/** The root of the composed collapsible: `open`, `defaultOpen`, `onOpenChange`, `disabled`. */
function CollapsibleRoot({ title: _title, onOpenChange, ...props }: CollapsibleRootProps) {
  return (
    <Base.Root
      {...props}
      {...(onOpenChange ? { onOpenChange: (open: boolean) => onOpenChange(open) } : {})}
    />
  );
}

export type CollapsibleTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & {
  asChild?: boolean;
};

/** The control that folds and unfolds. `asChild` draws your own element. */
export function CollapsibleTrigger({
  asChild,
  children,
  className,
  ...rest
}: CollapsibleTriggerProps) {
  return <Base.Trigger {...rest} className={className} {...asChildProps(asChild, children)} />;
}

export type CollapsibleContentProps = Part<ComponentProps<typeof Base.Panel>>;

/** What folds. */
export function CollapsibleContent({ className, ...rest }: CollapsibleContentProps) {
  return <Base.Panel {...rest} className={cx("fg-fold-panel fg-collapsible-content", className)} />;
}

/** `items` stays undefined: with items, `Accordion` is the props-driven one. */
export type AccordionRootProps = Part<
  Omit<
    ComponentProps<typeof BaseAccordion.Root>,
    "value" | "defaultValue" | "onValueChange" | "multiple" | "items"
  >
> & {
  items?: undefined;
  /** `single` (default): opening one folds the other; `multiple`: several open at once. */
  type?: "single" | "multiple";
  /** With `type="single"`: the open section can be folded again. Without it, one stays open. */
  collapsible?: boolean;
  /** Base UI's own spelling of `type="multiple"`. */
  multiple?: boolean;
  /** The open section (`single`) or sections (`multiple`). A list is read in either type. */
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string & string[]) => void;
};

const list = (v: string | string[] | undefined): string[] | undefined =>
  v === undefined ? undefined : Array.isArray(v) ? v : v === "" ? [] : [v];

/** The root of the composed accordion, as shadcn writes it: `type`, `collapsible`, `value`. */
function AccordionRoot({
  items: _items,
  type,
  collapsible,
  multiple,
  value,
  defaultValue,
  onValueChange,
  className,
  ...rest
}: AccordionRootProps) {
  const many = type === "multiple" || (type === undefined && multiple === true);
  // Radix: `single` without `collapsible` never lets the open section close. Base UI's own
  // spelling (no `type`) always could.
  const keepOne = type === "single" && !collapsible;
  const controlled = list(value);
  const initial = list(defaultValue);
  return (
    <BaseAccordion.Root
      {...rest}
      multiple={many}
      {...(controlled ? { value: controlled } : {})}
      {...(initial ? { defaultValue: initial } : {})}
      onValueChange={(next, details) => {
        const open = next as string[];
        if (keepOne && open.length === 0) {
          details.cancel();
          return;
        }
        (onValueChange as ((v: string | string[]) => void) | undefined)?.(
          many ? open : (open[0] ?? ""),
        );
      }}
      className={cx("fg-accordion", className)}
    />
  );
}

export type AccordionItemProps = Part<ComponentProps<typeof BaseAccordion.Item>> & {
  value: string;
};

/** One section: a `value`, its `AccordionTrigger` and its `AccordionContent`. */
export function AccordionItem({ className, ...rest }: AccordionItemProps) {
  return <BaseAccordion.Item {...rest} className={cx("fg-fold fg-fold-item", className)} />;
}

export type AccordionTriggerProps = Part<ComponentProps<typeof BaseAccordion.Trigger>>;

/** The heading and its button, with the caret. */
export function AccordionTrigger({ className, children, ...rest }: AccordionTriggerProps) {
  return (
    <BaseAccordion.Header className="fg-fold-header">
      <BaseAccordion.Trigger {...rest} className={cx("fg-fold-trigger", className)}>
        <Icon icon={ArrowDown01Icon} size={12} variant="mono" className="fg-fold-caret" />
        <span className="fg-fold-title">{children}</span>
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

export type AccordionContentProps = Part<ComponentProps<typeof BaseAccordion.Panel>>;

/** What a section holds when it is open. */
export function AccordionContent({ className, children, ...rest }: AccordionContentProps) {
  return (
    <BaseAccordion.Panel {...rest} className="fg-fold-panel">
      <div className={cx("fg-fold-body", className)}>{children}</div>
    </BaseAccordion.Panel>
  );
}
