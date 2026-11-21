// A file opened for a look: its name and kind in a header with the actions, the stage that shows
// it (a picture, a page of text, a PDF, a video, the contents of an archive, or a word that there
// is no preview), and the arrows to the previous and next file. A details panel may sit beside it.
//
// A root with parts: `FilePreviewHeader` (`FilePreviewNav`, `FilePreviewActions`) and
// `FilePreviewBody` (`FilePreviewStage`, `FilePreviewAside`). Without those as children it draws
// them all, and its children are the stage (your own sheet, slides…).

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Download01Icon,
  PlayFillIcon,
} from "@forgeron/icons";
import {
  createContext,
  useContext,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { hasPart } from "../part";
import { FILE_KINDS, fileKindOf, FileTypeMark, formatBytes, type FileKind } from "./drive-parts";

export interface ArchiveEntry {
  name: string;
  size?: number;
}

export interface FilePreviewProps {
  name: string;
  /** The kind; from the name by default. */
  kind?: FileKind;
  /** In bytes. */
  size?: number;
  /** The file's address: drawn for an image, a PDF, a video, a sound. */
  src?: string;
  /** The content of a text, a Markdown or a document, drawn as a page. */
  text?: string;
  /** The files inside an archive. */
  entries?: ReadonlyArray<ArchiveEntry>;
  /** A line under the name: who changed it, when. */
  meta?: ReactNode;
  /** Your own stage in place of the default one: a sheet, slides, a rendered document. */
  children?: ReactNode;
  /** More buttons in the header, before the download: share, open in the app. */
  actions?: ReactNode;
  onDownload?: () => void;
  onClose?: () => void;
  /** The file before and after it in its folder; the arrow keys too. */
  onPrevious?: () => void;
  onNext?: () => void;
  /** "3 / 12", next to the arrows. */
  position?: { index: number; total: number };
  /** A panel at the right of the stage: `FileDetails`. */
  aside?: ReactNode;
  className?: string;
}

interface PreviewContext extends Omit<FilePreviewProps, "children" | "className" | "kind"> {
  kind: FileKind;
  /** The stage given as children, in place of the default one. */
  stage: ReactNode;
}

const Ctx = createContext<PreviewContext | null>(null);

/** The file shown and its handlers, for a part of your own inside a `FilePreview`. */
export function useFilePreview(part = "useFilePreview"): PreviewContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <FilePreview>.`);
  return ctx;
}

/** A file shown for a look, with its actions and the way to its neighbours. */
export function FilePreview({ children, className, ...props }: FilePreviewProps) {
  const { name, kind, aside, onPrevious, onNext, onClose } = props;
  const k = kind ?? fileKindOf(name);
  const composed = hasPart(children, [FilePreviewHeader, FilePreviewBody]);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("input, textarea, select, video, audio, [role=tab]"))
      return;
    if (event.key === "ArrowLeft" && onPrevious) onPrevious();
    else if (event.key === "ArrowRight" && onNext) onNext();
    else if (event.key === "Escape" && onClose) onClose();
    else return;
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <Ctx.Provider value={{ ...props, kind: k, stage: composed ? undefined : children }}>
      <section
        data-slot="file-preview"
        className={cx("fg-fpv", aside !== undefined && "fg-fpv-with-aside", className)}
        aria-label={`Preview of ${name}`}
        onKeyDown={onKeyDown}
      >
        {composed ? (
          children
        ) : (
          <>
            <FilePreviewHeader />
            <FilePreviewBody />
          </>
        )}
      </section>
    </Ctx.Provider>
  );
}

/** The mark, the name, the kind, and the actions at the right. */
export function FilePreviewHeader({ className, children, ...rest }: ComponentProps<"header">) {
  const { name, kind: k, size, meta } = useFilePreview("FilePreviewHeader");
  const info = FILE_KINDS[k];
  return (
    <header data-slot="file-preview-header" {...rest} className={cx("fg-fpv-head", className)}>
      <FileTypeMark kind={k} size="sm" />
      <div className="fg-fpv-titles">
        <h2 className="fg-fpv-name">{name}</h2>
        <p className="fg-fpv-meta">
          {info.label}
          {size !== undefined ? ` · ${formatBytes(size)}` : ""}
          {meta ? <> · {meta}</> : null}
        </p>
      </div>
      {children ?? <FilePreviewActions />}
    </header>
  );
}

/** The arrows to the neighbours, your own `actions`, Download and Close. Children replace them. */
export function FilePreviewActions({ className, children, ...rest }: ComponentProps<"div">) {
  const { actions, onDownload, onClose, onPrevious, onNext } = useFilePreview("FilePreviewActions");
  return (
    <div data-slot="file-preview-actions" {...rest} className={cx("fg-fpv-actions", className)}>
      {children ?? (
        <>
          {onPrevious || onNext ? <FilePreviewNav /> : null}
          {actions}
          {onDownload ? (
            <IconButton icon={Download01Icon} label="Download" size="sm" onClick={onDownload} />
          ) : null}
          {onClose ? (
            <IconButton icon={Cancel01Icon} label="Close preview" size="sm" onClick={onClose} />
          ) : null}
        </>
      )}
    </div>
  );
}

/** Previous, "3 / 12", Next. */
export function FilePreviewNav({ className, ...rest }: ComponentProps<"span">) {
  const { onPrevious, onNext, position } = useFilePreview("FilePreviewNav");
  return (
    <span data-slot="file-preview-nav" {...rest} className={cx("fg-fpv-nav", className)}>
      <IconButton
        icon={ArrowLeft01Icon}
        label="Previous file"
        size="sm"
        disabled={!onPrevious}
        onClick={onPrevious}
      />
      {position ? (
        <span className="fg-fpv-pos">
          {position.index} / {position.total}
        </span>
      ) : null}
      <IconButton
        icon={ArrowRight01Icon}
        label="Next file"
        size="sm"
        disabled={!onNext}
        onClick={onNext}
      />
    </span>
  );
}

/** The stage and, beside it, the aside. */
export function FilePreviewBody({ className, children, ...rest }: ComponentProps<"div">) {
  const { aside } = useFilePreview("FilePreviewBody");
  return (
    <div data-slot="file-preview-body" {...rest} className={cx("fg-fpv-body", className)}>
      {children ?? (
        <>
          <FilePreviewStage />
          {aside !== undefined ? <FilePreviewAside>{aside}</FilePreviewAside> : null}
        </>
      )}
    </div>
  );
}

/** The panel at the right of the stage: `FileDetails`. */
export function FilePreviewAside({ className, ...rest }: ComponentProps<"div">) {
  return <div data-slot="file-preview-aside" {...rest} className={cx("fg-fpv-aside", className)} />;
}

/** The file itself: a picture, a page, a PDF, a video, an archive's contents, or "no preview". */
export function FilePreviewStage({ className, children, ...rest }: ComponentProps<"div">) {
  const {
    name,
    kind: k,
    size,
    src,
    text,
    entries,
    onDownload,
    stage: given,
  } = useFilePreview("FilePreviewStage");
  const info = FILE_KINDS[k];
  const download = onDownload ? (
    <Button size="sm" onClick={onDownload}>
      <Icon icon={Download01Icon} size={12} variant="mono" />
      Download{size !== undefined ? ` ${formatBytes(size)}` : ""}
    </Button>
  ) : null;

  const content = (): ReactNode => {
    if (children !== undefined) return children;
    if (given !== undefined) return given;
    if (k === "image" && src) return <img className="fg-fpv-img" src={src} alt={name} />;
    if (k === "video" && src)
      return (
        // A file of the user: captions are theirs to bring.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video className="fg-fpv-video" src={src} controls preload="metadata" aria-label={name} />
      );
    if (k === "audio" && src)
      return <audio className="fg-fpv-audio" src={src} controls aria-label={name} />;
    if (k === "pdf" && src) return <iframe className="fg-fpv-frame" src={src} title={name} />;
    if (text !== undefined && (k === "text" || k === "doc" || k === "code" || k === "pdf"))
      return (
        <article className={cx("fg-fpv-paper", k === "code" && "fg-fpv-code")} aria-label={name}>
          {text ? <pre>{text}</pre> : <p className="fg-fpv-dim">This document is empty.</p>}
        </article>
      );
    if (k === "archive" && entries)
      return (
        <div className="fg-fpv-none">
          <FileTypeMark kind="archive" size="xl" />
          <b>{name}</b>
          <p>Archives can't be previewed. Download to extract.</p>
          <ul className="fg-fpv-entries">
            {entries.map((e) => (
              <li key={e.name}>
                <span>{e.name}</span>
                <span>{formatBytes(e.size)}</span>
              </li>
            ))}
          </ul>
          {download}
        </div>
      );
    if (k === "image" || k === "video")
      return (
        <div
          className="fg-fpv-placeholder"
          role="img"
          aria-label={`${info.label} preview not available`}
        >
          <Icon icon={k === "video" ? PlayFillIcon : info.icon} size={36} variant="mono" />
        </div>
      );
    if (k === "pdf" || k === "doc" || k === "text")
      return (
        <div
          className="fg-fpv-paper fg-fpv-sketch"
          role="img"
          aria-label={`${info.label} preview not available`}
        >
          <i className="fg-fpv-sketch-h" />
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} className={i % 4 === 3 ? "fg-fpv-sketch-s" : undefined} />
          ))}
        </div>
      );
    return (
      <div className="fg-fpv-none">
        <FileTypeMark kind={k} size="xl" />
        <b>No preview for this file</b>
        <p>
          {info.label}
          {size !== undefined ? ` · ${formatBytes(size)}` : ""}
        </p>
        {download}
      </div>
    );
  };

  return (
    <div
      data-slot="file-preview-stage"
      tabIndex={0}
      aria-label={`${name}, ${info.label}`}
      role="group"
      {...rest}
      className={cx("fg-fpv-stage", className)}
    >
      {content()}
    </div>
  );
}
