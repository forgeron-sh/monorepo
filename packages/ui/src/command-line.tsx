import { useEffect, useState, type ComponentProps, type MouseEvent } from "react";
import { cx } from "./cx";
import { hasPart, renderPart, type Part } from "./part";

export interface CommandLineProps extends ComponentProps<"code"> {
  /** Shown before the command in ember, not part of it; `$` by default. */
  prompt?: string;
  /** `false`: inline in running text, without the frame. */
  framed?: boolean;
  children: ComponentProps<"code">["children"];
}

/** A command to type, `$ npx forgeron init`: framed on `bg-sunk`, or inline. */
export function CommandLine({
  prompt = "$",
  framed = true,
  className,
  children,
  ...rest
}: CommandLineProps) {
  const frame = cx(framed ? "fg-cmd" : "fg-cmd-inline", className);
  // Parts form: the caller places the prompt, the text and the copy button.
  if (hasPart(children, PARTS)) {
    return (
      <code data-slot="command-line" {...rest} className={frame}>
        {children}
      </code>
    );
  }
  const mark = (
    <span className="fg-cmd-prompt" aria-hidden="true">
      {prompt}
    </span>
  );
  return framed ? (
    <code data-slot="command-line" {...rest} className={frame}>
      {mark}
      {children}
    </code>
  ) : (
    <code data-slot="command-line" {...rest} className={frame}>
      {mark} {children}
    </code>
  );
}

/** What comes before the command, in ember, not part of it. Decorative. */
export function CommandLinePrompt({
  className,
  asChild,
  ...rest
}: Part<ComponentProps<"span">> & { asChild?: boolean }) {
  return renderPart("span", cx("fg-cmd-prompt", className), asChild, {
    "aria-hidden": "true",
    "data-slot": "command-line-prompt",
    ...rest,
  });
}

/** The command itself. */
export function CommandLineText({
  className,
  asChild,
  ...rest
}: Part<ComponentProps<"span">> & { asChild?: boolean }) {
  return renderPart("span", cx("fg-cmd-text", className), asChild, {
    "data-slot": "command-line-text",
    ...rest,
  });
}

export interface CommandLineCopyProps extends Omit<Part<ComponentProps<"button">>, "value"> {
  /** What is copied to the clipboard. */
  value: string;
  asChild?: boolean;
}

/** Copies `value`; says "Copied" for two seconds. `children` replaces the "Copy" label. */
export function CommandLineCopy({
  value,
  className,
  asChild,
  children,
  onClick,
  ...rest
}: CommandLineCopyProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return renderPart("button", cx("fg-cmd-copy", className), asChild, {
    type: "button",
    "data-slot": "command-line-copy",
    ...rest,
    onClick: async (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
      } catch {
        // Without clipboard access the text is still there to select.
      }
    },
    children: asChild ? children : copied ? "Copied" : (children ?? "Copy"),
  });
}

const PARTS = [CommandLinePrompt, CommandLineText, CommandLineCopy];
