// A section that folds (Collapsible) and a stack of them (Accordion). Base UI keeps the buttons,
// `aria-expanded`, `aria-controls` and, for the accordion, the arrow keys between headers.

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { Collapsible as Base } from "@base-ui/react/collapsible";
import { ArrowDown01Icon } from "@forgeron/icons";
import type { ReactNode } from "react";
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

/** One section that folds. No animation under `prefers-reduced-motion`, a short one otherwise. */
export function Collapsible({
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

/** Sections stacked: one open at a time, or several. Up and Down move between the headers. */
export function Accordion({
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
