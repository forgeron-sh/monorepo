// Making a record without leaving the page, after the Tasks "New issue" modal: where it goes, a
// title, a description, its properties as chips, then "Create more" and the primary button.
// It is a `Modal` (modal.tsx): focus trap, Escape, outside press and the return of focus.

import type { KeyboardEvent, ReactElement, ReactNode, RefObject } from "react";
import { useId, useRef, useState } from "react";
import { Button } from "../button";
import { Switch } from "../controls";
import { useControllableState } from "../hooks/use-controllable";
import { Modal } from "../modal";
import { PropertyChips } from "./record-properties";

/* ---------------------------------------------------------------- CreateDialog */

export interface CreateDraft {
  title: string;
  description: string;
  /** The "Create more" switch at the time of creation. */
  createMore: boolean;
}

export interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called with the trimmed title and description when the button or ⌘↵ creates the record; a
   * missing title is refused before. Then the dialog closes, or empties for the next with
   * "Create more".
   */
  onSubmit: (draft: CreateDraft) => void;
  /** A button that opens it. */
  trigger?: ReactElement;
  /** What is being made: "New issue", "New lead". */
  heading?: string;
  /** Where it goes, before the heading: a team chip (a `SelectMenu` in its `chip` variant). */
  context?: ReactNode;
  /** The pickers of its properties, each in its `chip` variant. */
  properties?: ReactNode;
  /** At the left of the footer: attach a file. */
  footerStart?: ReactNode;
  /** The title, when the caller keeps it; else the dialog keeps it until it closes. */
  title?: string;
  onTitleChange?: (value: string) => void;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  /** Said in the title field when it is left empty. */
  requiredMessage?: string;
  /** Keeps the dialog open after each creation. */
  createMore?: boolean;
  defaultCreateMore?: boolean;
  onCreateMoreChange?: (value: boolean) => void;
  /** The primary button: "Create issue", "Create lead". */
  submitLabel?: string;
  className?: string;
}

type FormProps = Omit<CreateDialogProps, "open" | "onOpenChange" | "trigger" | "heading"> & {
  titleRef: RefObject<HTMLInputElement | null>;
  close: () => void;
};

// The form lives inside the popup, so its state is dropped when the dialog closes.
function CreateForm({
  onSubmit,
  properties,
  footerStart,
  title: titleProp,
  onTitleChange,
  description: descriptionProp,
  onDescriptionChange,
  titlePlaceholder = "Issue title",
  descriptionPlaceholder = "Add description…",
  requiredMessage = "A title is required",
  createMore: createMoreProp,
  defaultCreateMore = false,
  onCreateMoreChange,
  submitLabel = "Create issue",
  titleRef,
  close,
}: FormProps) {
  const descId = useId();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useControllableState({
    value: titleProp,
    defaultValue: "",
    onChange: onTitleChange,
  });
  const [description, setDescription] = useControllableState({
    value: descriptionProp,
    defaultValue: "",
    onChange: onDescriptionChange,
  });
  const [createMore, setCreateMore] = useControllableState({
    value: createMoreProp,
    defaultValue: defaultCreateMore,
    onChange: onCreateMoreChange,
  });
  const [missing, setMissing] = useState(false);
  const submit = () => {
    const t = title.trim();
    if (!t) {
      setMissing(true);
      titleRef.current?.focus();
      return;
    }
    onSubmit({ title: t, description: description.trim(), createMore });
    if (createMore) {
      setTitle("");
      setDescription("");
      titleRef.current?.focus();
    } else {
      close();
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  };
  return (
    <form
      className="fg-create"
      noValidate
      onKeyDown={onKeyDown}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input
        ref={titleRef}
        className="fg-create-title"
        placeholder={missing ? requiredMessage : titlePlaceholder}
        aria-label={titlePlaceholder}
        aria-invalid={missing ? true : undefined}
        aria-describedby={missing ? descId : undefined}
        autoComplete="off"
        value={title}
        onChange={(event) => {
          setMissing(false);
          setTitle(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            descriptionRef.current?.focus();
          }
        }}
      />
      {missing ? (
        <span id={descId} className="fg-sr" role="alert">
          {requiredMessage}
        </span>
      ) : null}
      <textarea
        ref={descriptionRef}
        className="fg-create-desc"
        placeholder={descriptionPlaceholder}
        aria-label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      {properties ? <PropertyChips className="fg-create-props">{properties}</PropertyChips> : null}
      <div className="fg-create-foot">
        {footerStart}
        <span className="fg-create-space" />
        <Switch
          label="Create more"
          checked={createMore}
          onChange={(event) => setCreateMore(event.target.checked)}
        />
        <Button type="submit" variant="primary" size="sm" kbd="⌘↵">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * The "New issue" modal: its team, a large title, a description, its properties as chips, then
 * "Create more" and the primary button (⌘↵). Enter in the title moves to the description.
 */
export function CreateDialog({
  open,
  onOpenChange,
  trigger,
  heading = "New issue",
  context,
  className,
  ...form
}: CreateDialogProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={heading}
      initialFocus={titleRef}
      {...(trigger ? { trigger } : {})}
      {...(context ? { context } : {})}
      {...(className ? { className } : {})}
    >
      <CreateForm {...form} titleRef={titleRef} close={() => onOpenChange(false)} />
    </Modal>
  );
}
