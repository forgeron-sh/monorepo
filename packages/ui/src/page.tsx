import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { renderPart } from "./shell-part";

type PartProps<T extends "div" | "header" | "main" | "h1" | "p"> = ComponentProps<T> & {
  asChild?: boolean;
};

interface PageBase {
  className?: string;
}

/** The props form: `title` builds the heading, description, actions and body. */
export interface PageProps
  extends PageBase, Omit<ComponentProps<"main">, "title" | "className" | "children"> {
  title: string;
  description?: ReactNode;
  /** Right of the title, e.g. a primary `Button`. */
  actions?: ReactNode;
  children?: ReactNode;
}

/** The parts form: no `title`, the children are `PageHeader` and `PageBody`. */
export interface PagePartsProps extends PageBase, Omit<ComponentProps<"main">, "className"> {
  title?: undefined;
  description?: undefined;
  actions?: undefined;
}

/** View layout: heading, optional description and actions, then the content. */
export function Page(props: PageProps | PagePartsProps) {
  if (props.title === undefined) {
    const { className, title: _t, description: _d, actions: _a, ...rest } = props;
    return <main {...rest} data-slot="page" className={cx("fg-page", className)} />;
  }
  const { title, description, actions, className, children, ...rest } = props;
  return (
    <main {...rest} data-slot="page" className={cx("fg-page", className)}>
      <header className="fg-page-head">
        <div className="fg-page-titles">
          <h1 className="fg-page-title">{title}</h1>
          {description ? <p className="fg-page-desc">{description}</p> : null}
        </div>
        {actions ? <div className="fg-page-actions">{actions}</div> : null}
      </header>
      <div className="fg-page-body">{children}</div>
    </main>
  );
}

/** The head of a page: titles on the left, actions on the right. */
export function PageHeader({ className, asChild, ...rest }: PartProps<"header">) {
  return renderPart("header", cx("fg-page-head", className), asChild, {
    ...rest,
    "data-slot": "page-header",
  });
}

/** Groups the title and the description. */
export function PageTitles({ className, asChild, ...rest }: PartProps<"div">) {
  return renderPart("div", cx("fg-page-titles", className), asChild, {
    ...rest,
    "data-slot": "page-titles",
  });
}

export function PageTitle({ className, asChild, ...rest }: PartProps<"h1">) {
  return renderPart("h1", cx("fg-page-title", className), asChild, {
    ...rest,
    "data-slot": "page-title",
  });
}

export function PageDescription({ className, asChild, ...rest }: PartProps<"p">) {
  return renderPart("p", cx("fg-page-desc", className), asChild, {
    ...rest,
    "data-slot": "page-description",
  });
}

export function PageActions({ className, asChild, ...rest }: PartProps<"div">) {
  return renderPart("div", cx("fg-page-actions", className), asChild, {
    ...rest,
    "data-slot": "page-actions",
  });
}

export function PageBody({ className, asChild, ...rest }: PartProps<"div">) {
  return renderPart("div", cx("fg-page-body", className), asChild, {
    ...rest,
    "data-slot": "page-body",
  });
}
