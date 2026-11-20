// Where files land: a framed area with a button, or an overlay over a view while files are dragged
// over it. With `onFiles`, `DropZone` is the props-driven one; without, the root of its parts
// (`DropZoneIcon`, `DropZoneTitle`, `DropZoneDescription`, `DropZoneTrigger`, `DropZoneOverlay`),
// which it is built from. `FileInput` is the sibling that also keeps the list of what was chosen
// and checks its size and count; both share `matchesAccept` (D-157).

import { Upload01Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type ReactNode,
} from "react";
import { Button } from "./button";
import { cx } from "./cx";
import { matchesAccept } from "./file-input";
import { Icon } from "./icon";

/**
 * Whether a file matches an `accept` list as `<input type="file">` reads it: extensions
 * (`.pdf`), types (`image/png`) and families (`image/*`), separated by commas.
 */
export const acceptsFile: (file: { name: string; type: string }, accept?: string) => boolean =
  matchesAccept;

const hasFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

export interface DropZoneProps {
  /** The files dropped or chosen that match `accept`. */
  onFiles: (files: File[]) => void;
  /** The files left out by `accept` or `multiple`: say why. */
  onReject?: (files: File[]) => void;
  /** As on `<input type="file">`: `.pdf,image/*`. */
  accept?: string;
  /** Takes several files at once; true by default. */
  multiple?: boolean;
  disabled?: boolean;
  /** The big line of the framed zone. */
  title?: ReactNode;
  /** A line under it: the types and the size allowed. */
  description?: ReactNode;
  /** The button that opens the file chooser. */
  buttonLabel?: string;
  /**
   * A view to cover: the zone is then invisible until files are dragged over it, and shows the
   * overlay with `overlayLabel`. Without children, it is a framed area with its button.
   */
  children?: ReactNode;
  /** Said on the overlay: "Drop to upload to Contracts". */
  overlayLabel?: ReactNode;
  className?: string;
}

/** `onFiles` stays undefined: with it, `DropZone` is the props-driven one. */
export type DropZoneRootProps = Omit<ComponentProps<"div">, "className" | "title"> & {
  onFiles?: undefined;
  /** The files dropped or chosen that match `accept`. */
  onDropFiles?: (files: File[]) => void;
  /** The files left out by `accept` or `multiple`. */
  onReject?: (files: File[]) => void;
  accept?: string;
  /** Takes several files at once; true by default. */
  multiple?: boolean;
  disabled?: boolean;
  /** `frame`: a framed area. `cover`: invisible until files are dragged over the view inside. */
  variant?: "frame" | "cover";
  className?: string;
};

interface DropState {
  active: boolean;
  disabled: boolean;
  /** Opens the file chooser. */
  open: () => void;
  hintId: string;
}

const DropContext = createContext<DropState | null>(null);

/** The state of the enclosing `DropZone`: `active` while files are dragged over it. */
export function useDropZone(): DropState {
  const state = useContext(DropContext);
  if (!state) throw new Error("DropZone parts go inside <DropZone>.");
  return state;
}

/**
 * Where files land: a framed area with a button, or an overlay over a view while files are
 * dragged. With `onFiles`: the props-driven zone. Without: the root of the parts.
 */
export function DropZone(props: DropZoneProps | DropZoneRootProps) {
  return props.onFiles !== undefined ? (
    <DropZoneBox {...(props as DropZoneProps)} />
  ) : (
    <DropZoneRoot {...(props as DropZoneRootProps)} />
  );
}

function DropZoneBox({
  onFiles,
  onReject,
  accept,
  multiple,
  disabled,
  title = "Drop files here",
  description,
  buttonLabel = "Choose files",
  children,
  overlayLabel = "Drop to upload",
  className,
}: DropZoneProps) {
  return (
    <DropZoneRoot
      onDropFiles={onFiles}
      {...(onReject ? { onReject } : {})}
      {...(accept !== undefined ? { accept } : {})}
      {...(multiple !== undefined ? { multiple } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(className !== undefined ? { className } : {})}
      variant={children !== undefined ? "cover" : "frame"}
    >
      {children !== undefined ? (
        <>
          {children}
          <DropZoneOverlay>{overlayLabel}</DropZoneOverlay>
        </>
      ) : (
        <>
          <DropZoneIcon />
          <ActiveTitle title={title} overlayLabel={overlayLabel} />
          {description ? <DropZoneDescription>{description}</DropZoneDescription> : null}
          <DescribedTrigger described={Boolean(description)}>{buttonLabel}</DescribedTrigger>
        </>
      )}
    </DropZoneRoot>
  );
}

function DescribedTrigger({ described, children }: { described: boolean; children: ReactNode }) {
  const { hintId } = useDropZone();
  return (
    <DropZoneTrigger {...(described ? { "aria-describedby": hintId } : {})}>
      {children}
    </DropZoneTrigger>
  );
}

function ActiveTitle({ title, overlayLabel }: { title: ReactNode; overlayLabel: ReactNode }) {
  const { active } = useDropZone();
  return <DropZoneTitle>{active ? overlayLabel : title}</DropZoneTitle>;
}

function DropZoneRoot({
  onFiles: _onFiles,
  onDropFiles,
  onReject,
  accept,
  multiple = true,
  disabled = false,
  variant = "frame",
  className,
  children,
  ...rest
}: DropZoneRootProps) {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();

  const take = (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const ok = files.filter((f) => acceptsFile(f, accept));
    const kept = multiple ? ok : ok.slice(0, 1);
    const rejected = files.filter((f) => !kept.includes(f));
    if (kept.length > 0) onDropFiles?.(kept);
    if (rejected.length > 0) onReject?.(rejected);
  };

  const drag = disabled
    ? {}
    : {
        onDragEnter: (e: DragEvent<HTMLDivElement>) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          depth.current += 1;
          setActive(true);
        },
        onDragOver: (e: DragEvent<HTMLDivElement>) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        },
        onDragLeave: (e: DragEvent<HTMLDivElement>) => {
          if (!hasFiles(e)) return;
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setActive(false);
        },
        onDrop: (e: DragEvent<HTMLDivElement>) => {
          if (!hasFiles(e)) return;
          // A folder or a row inside may have taken the drop already.
          depth.current = 0;
          setActive(false);
          if (e.defaultPrevented) return;
          e.preventDefault();
          take(e.dataTransfer.files);
        },
      };

  const state: DropState = { active, disabled, open: () => input.current?.click(), hintId };
  return (
    <DropContext.Provider value={state}>
      <div
        {...rest}
        {...drag}
        className={cx(
          variant === "cover" ? "fg-dropzone-cover" : "fg-dropzone",
          active && "fg-dropzone-active",
          variant === "frame" && disabled && "fg-dropzone-disabled",
          className,
        )}
      >
        {children}
        <input
          ref={input}
          type="file"
          className="fg-sr"
          tabIndex={-1}
          aria-hidden="true"
          multiple={multiple}
          {...(accept ? { accept } : {})}
          disabled={disabled}
          onChange={(e) => {
            take(e.currentTarget.files);
            e.currentTarget.value = "";
          }}
        />
      </div>
    </DropContext.Provider>
  );
}

/** The upload icon of the framed zone. */
export function DropZoneIcon({ className }: { className?: string }) {
  return <Icon icon={Upload01Icon} size={36} className={cx("fg-dropzone-icon", className)} />;
}

/** The big line of the framed zone. */
export function DropZoneTitle({ className, ...rest }: ComponentProps<"p">) {
  return <p {...rest} className={cx("fg-dropzone-title", className)} />;
}

/** A line under the title: what is allowed. Describes the button. */
export function DropZoneDescription({ className, ...rest }: ComponentProps<"p">) {
  const { hintId } = useDropZone();
  return <p id={hintId} {...rest} className={cx("fg-dropzone-text", className)} />;
}

export type DropZoneTriggerProps = Omit<ComponentProps<"button">, "onClick" | "className"> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
};

/** The button that opens the file chooser. */
export function DropZoneTrigger({ asChild, children, ...rest }: DropZoneTriggerProps) {
  const { disabled, open } = useDropZone();
  return (
    <Button
      size="sm"
      disabled={disabled}
      onClick={open}
      {...rest}
      {...(asChild ? { asChild } : {})}
    >
      {asChild ? (
        children
      ) : (
        <>
          <Icon icon={Upload01Icon} size={12} variant="mono" />
          {children}
        </>
      )}
    </Button>
  );
}

/** What covers the view while files are dragged over it; says what the drop does. */
export function DropZoneOverlay({
  className,
  children = "Drop to upload",
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { active } = useDropZone();
  return (
    <>
      {active ? (
        <div className={cx("fg-dropzone-overlay", className)} aria-hidden="true">
          <span>
            <Icon icon={Upload01Icon} size={24} />
            {children}
          </span>
        </div>
      ) : null}
      <span className="fg-sr" aria-live="polite">
        {active ? children : ""}
      </span>
    </>
  );
}
