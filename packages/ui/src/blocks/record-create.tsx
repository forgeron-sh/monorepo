// Making a record without leaving the page, after the Tasks "New issue" modal: where it goes, a
// title, a description, its properties as chips, then "Create more" and the primary button.
// It is a `Modal` (modal.tsx) on the `Dialog` parts: focus trap, Escape, outside press and the
// return of focus are Base UI's.
//
// With no children, `CreateDialog` draws the whole modal from its props. With children it is the
// root of its parts, which share the draft:
//
//   <CreateDialog open={open} onOpenChange={setOpen} onSubmit={create}>
//     <CreateDialogTrigger asChild><Button>New issue</Button></CreateDialogTrigger>
//     <CreateDialogContent>
//       <CreateDialogHeader>
//         <CreateDialogHeading>New issue</CreateDialogHeading>
//         <CreateDialogClose />
//       </CreateDialogHeader>
//       <CreateDialogForm>
//         <CreateDialogTitle />
//         <CreateDialogDescription />
//         <CreateDialogProperties>{pickers}</CreateDialogProperties>
//         <CreateDialogFooter>
//           <CreateDialogMore />
//           <CreateDialogSubmit />
//         </CreateDialogFooter>
//       </CreateDialogForm>
//     </CreateDialogContent>
//   </CreateDialog>

import type { ComponentProps, KeyboardEvent, ReactElement, ReactNode, RefObject } from "react";
import { createContext, useContext, useId, useRef, useState } from "react";
import { Button } from "../button";
import { Switch, type SwitchProps } from "../controls";
import { cx } from "../cx";
import { Dialog, DialogTrigger } from "../dialog";
import { useControllableState } from "../hooks/use-controllable";
import {
  ModalClose,
  ModalContent,
  ModalContext,
  ModalHeader,
  ModalTitle,
  type ModalContentProps,
} from "../modal";
import { PropertyChips } from "./record-properties";

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
  /** The parts (`CreateDialogContent`…) in place of the modal drawn from the props. */
  children?: ReactNode;
}

/** What the root keeps for its parts: the props that outlive the form. */
type RootContextValue = Omit<
  CreateDialogProps,
  "trigger" | "heading" | "context" | "properties" | "footerStart" | "className" | "children"
>;

/** The fields the form moves the focus between. */
interface FieldRefs {
  titleRef: RefObject<HTMLInputElement | null>;
  descriptionRef: RefObject<HTMLTextAreaElement | null>;
}

interface FormContextValue {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  createMore: boolean;
  setCreateMore: (value: boolean) => void;
  missing: boolean;
  setMissing: (value: boolean) => void;
  /** The id of the message said when the title is missing. */
  messageId: string;
  submit: () => void;
  root: RootContextValue;
}

const RootContext = createContext<RootContextValue | null>(null);
const RefsContext = createContext<FieldRefs | null>(null);
const FormContext = createContext<FormContextValue | null>(null);

const useRoot = (part: string) => {
  const ctx = useContext(RootContext);
  if (!ctx) throw new Error(`<${part}> goes inside a <CreateDialog>.`);
  return ctx;
};

const useRefs = (part: string) => {
  const ctx = useContext(RefsContext);
  if (!ctx) throw new Error(`<${part}> goes inside a <CreateDialog>.`);
  return ctx;
};

/** The draft being written and what to do with it. For parts of your own, inside a `CreateDialogForm`. */
export function useCreateDialogForm(part = "a create-dialog part"): FormContextValue {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error(`<${part}> goes inside a <CreateDialogForm>.`);
  return ctx;
}

/**
 * The "New issue" modal: its team, a large title, a description, its properties as chips, then
 * "Create more" and the primary button (⌘↵). Enter in the title moves to the description.
 * Without children it draws all of it from its props; with children it is the root of the parts.
 */
export function CreateDialog({
  open,
  onOpenChange,
  trigger,
  heading = "New issue",
  context,
  properties,
  footerStart,
  className,
  children,
  ...form
}: CreateDialogProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <RefsContext value={{ titleRef, descriptionRef }}>
        <RootContext value={{ open, onOpenChange, ...form }}>
          {children ?? (
            <>
              {trigger ? <DialogTrigger render={trigger} /> : null}
              <CreateDialogContent {...(className ? { className } : {})}>
                <CreateDialogHeader>
                  {context ? <CreateDialogContext>{context}</CreateDialogContext> : null}
                  <CreateDialogHeading>{heading}</CreateDialogHeading>
                  <CreateDialogClose />
                </CreateDialogHeader>
                <CreateDialogForm>
                  <CreateDialogTitle />
                  <CreateDialogDescription />
                  {properties ? (
                    <CreateDialogProperties>{properties}</CreateDialogProperties>
                  ) : null}
                  <CreateDialogFooter>
                    {footerStart}
                    <span className="fg-create-space" />
                    <CreateDialogMore />
                    <CreateDialogSubmit />
                  </CreateDialogFooter>
                </CreateDialogForm>
              </CreateDialogContent>
            </>
          )}
        </RootContext>
      </RefsContext>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- the frame */

/** Opens the dialog; `asChild` draws your own button. */
export { DialogTrigger as CreateDialogTrigger } from "../dialog";

/** The modal with its scrim, in a portal; focus goes to the title when it opens. */
export function CreateDialogContent({ ...rest }: ModalContentProps) {
  const { titleRef } = useRefs("CreateDialogContent");
  return <ModalContent data-slot="create-dialog-content" initialFocus={titleRef} {...rest} />;
}

/** The top row: where it goes, what it is, the close button. */
export function CreateDialogHeader(props: ComponentProps<typeof ModalHeader>) {
  return <ModalHeader data-slot="create-dialog-header" {...props} />;
}

/** Where it goes, before the heading: a team chip, a project; followed by a ›. */
export const CreateDialogContext = ModalContext;

/** What is being made: "New issue". The dialog's accessible name. */
export function CreateDialogHeading(props: ComponentProps<typeof ModalTitle>) {
  return <ModalTitle data-slot="create-dialog-heading" {...props} />;
}

/** The close button in the header. */
export function CreateDialogClose(props: ComponentProps<typeof ModalClose>) {
  return <ModalClose data-slot="create-dialog-close" {...props} />;
}

/* ---------------------------------------------------------------- the form */

// The form lives inside the popup, so its state is dropped when the dialog closes.

/** The form: it keeps the draft (the title, the description, "Create more") and creates on ⌘↵. */
export function CreateDialogForm({ className, ...rest }: Omit<ComponentProps<"form">, "onSubmit">) {
  const root = useRoot("CreateDialogForm");
  const messageId = useId();
  const { titleRef } = useRefs("CreateDialogForm");
  const [title, setTitle] = useControllableState({
    value: root.title,
    defaultValue: "",
    onChange: root.onTitleChange,
  });
  const [description, setDescription] = useControllableState({
    value: root.description,
    defaultValue: "",
    onChange: root.onDescriptionChange,
  });
  const [createMore, setCreateMore] = useControllableState({
    value: root.createMore,
    defaultValue: root.defaultCreateMore ?? false,
    onChange: root.onCreateMoreChange,
  });
  const [missing, setMissing] = useState(false);
  const submit = () => {
    const t = title.trim();
    if (!t) {
      setMissing(true);
      titleRef.current?.focus();
      return;
    }
    root.onSubmit({ title: t, description: description.trim(), createMore });
    if (createMore) {
      setTitle("");
      setDescription("");
      titleRef.current?.focus();
    } else {
      root.onOpenChange(false);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    rest.onKeyDown?.(event);
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  };
  return (
    <FormContext
      value={{
        title,
        setTitle,
        description,
        setDescription,
        createMore,
        setCreateMore,
        missing,
        setMissing,
        messageId,
        submit,
        root,
      }}
    >
      <form
        data-slot="create-dialog-form"
        noValidate
        {...rest}
        className={cx("fg-create", className)}
        onKeyDown={onKeyDown}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      />
    </FormContext>
  );
}

/** The large title field; Enter moves to the description. */
export function CreateDialogTitle({
  className,
  ...rest
}: Omit<ComponentProps<"input">, "value" | "onChange">) {
  const f = useCreateDialogForm("CreateDialogTitle");
  const { titleRef, descriptionRef } = useRefs("CreateDialogTitle");
  const placeholder = f.root.titlePlaceholder ?? "Issue title";
  const message = f.root.requiredMessage ?? "A title is required";
  return (
    <>
      <input
        ref={titleRef}
        data-slot="create-dialog-title"
        placeholder={f.missing ? message : placeholder}
        aria-label={placeholder}
        aria-invalid={f.missing ? true : undefined}
        aria-describedby={f.missing ? f.messageId : undefined}
        autoComplete="off"
        {...rest}
        className={cx("fg-create-title", className)}
        value={f.title}
        onChange={(event) => {
          f.setMissing(false);
          f.setTitle(event.target.value);
        }}
        onKeyDown={(event) => {
          rest.onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            descriptionRef.current?.focus();
          }
        }}
      />
      {f.missing ? (
        <span id={f.messageId} className="fg-sr" role="alert">
          {message}
        </span>
      ) : null}
    </>
  );
}

/** The description box. */
export function CreateDialogDescription({
  className,
  ...rest
}: Omit<ComponentProps<"textarea">, "value" | "onChange">) {
  const f = useCreateDialogForm("CreateDialogDescription");
  const { descriptionRef } = useRefs("CreateDialogDescription");
  return (
    <textarea
      ref={descriptionRef}
      data-slot="create-dialog-description"
      placeholder={f.root.descriptionPlaceholder ?? "Add description…"}
      aria-label="Description"
      {...rest}
      className={cx("fg-create-desc", className)}
      value={f.description}
      onChange={(event) => f.setDescription(event.target.value)}
    />
  );
}

/** The pickers of its properties, side by side as chips. */
export function CreateDialogProperties({
  className,
  ...rest
}: ComponentProps<typeof PropertyChips>) {
  return (
    <PropertyChips
      data-slot="create-dialog-properties"
      {...rest}
      className={cx("fg-create-props", className)}
    />
  );
}

/** The foot of the form: attach a file at the left, "Create more" and the button at the right. */
export function CreateDialogFooter({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="create-dialog-footer" {...rest} className={cx("fg-create-foot", className)} />
  );
}

/** The "Create more" switch. */
export function CreateDialogMore({
  label = "Create more",
  ...rest
}: { label?: string } & Omit<SwitchProps, "label" | "checked" | "onChange">) {
  const f = useCreateDialogForm("CreateDialogMore");
  return (
    <Switch
      data-slot="create-dialog-more"
      {...rest}
      label={label}
      checked={f.createMore}
      onChange={(event) => f.setCreateMore(event.target.checked)}
    />
  );
}

/** The primary button; ⌘↵ does the same. */
export function CreateDialogSubmit({ children, ...rest }: Omit<ComponentProps<"button">, "type">) {
  const f = useCreateDialogForm("CreateDialogSubmit");
  return (
    <Button
      data-slot="create-dialog-submit"
      type="submit"
      variant="primary"
      size="sm"
      kbd="⌘↵"
      {...(rest as object)}
    >
      {children ?? f.root.submitLabel ?? "Create issue"}
    </Button>
  );
}
