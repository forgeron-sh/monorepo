import type { ComponentType, ReactElement } from "react";
import { createElement, createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { z } from "zod";
import type { Access } from "../action";
import { ViewClient, type ViewRuntime } from "./client";

/** Paths the platform keeps for the tool's other interfaces (docs/sdk.md §7). */
const RESERVED = ["/mcp", "/api", "/cli", "/play", "/_f"];

export interface ViewOptions<P extends z.ZodType = z.ZodType> {
  title: string;
  /** Where the view is served, below `/t/<tool>`. */
  path: `/${string}`;
  /** Level the person must hold; checked before the component renders. */
  access: Access;
  /** Validates the URL search parameters; `useParams` returns its output. */
  params?: P;
  component: ComponentType;
}

export interface ViewDefinition<P extends z.ZodType = z.ZodType> extends ViewOptions<P> {
  readonly kind: "view";
}

/** Declares a page of the tool, served by the tool's Worker and built by `forgeron build`. */
export function defineView<P extends z.ZodType = z.ZodType>(
  options: ViewOptions<P>,
): ViewDefinition<P> {
  if (typeof options.title !== "string" || !options.title.trim()) {
    throw new TypeError("A view needs a title.");
  }
  if (typeof options.access !== "string" || !options.access.trim()) {
    throw new TypeError("A view needs an access level.");
  }
  if (typeof options.path !== "string" || !options.path.startsWith("/")) {
    throw new TypeError(`The path of view "${options.title}" must start with "/".`);
  }
  const reserved = RESERVED.find((p) => options.path === p || options.path.startsWith(`${p}/`));
  if (reserved) {
    throw new TypeError(`The path "${options.path}" is reserved by the platform (${reserved}).`);
  }
  if (typeof options.component !== "function") {
    throw new TypeError(`View "${options.title}" needs a component.`);
  }
  return { kind: "view", ...options };
}

interface ViewContextValue {
  runtime: ViewRuntime;
  client: ViewClient;
  schema: z.ZodType | undefined;
}

const ViewContext = createContext<ViewContextValue | undefined>(undefined);

export function useViewContext(hook: string): ViewContextValue {
  const value = useContext(ViewContext);
  if (!value) throw new Error(`${hook} must be used inside a view rendered by ViewHost.`);
  return value;
}

export interface ViewHostProps {
  view: ViewDefinition;
  runtime: ViewRuntime;
  /** Shown instead of the view when the person lacks its access level. */
  forbidden?: ReactElement;
  /** Shown when the URL parameters do not match `params`. */
  invalidParams?: (error: z.ZodError) => ReactElement;
}

/** Renders a view: access first, then parameters, and only then the component. */
export function ViewHost(props: ViewHostProps): ReactElement {
  const { view, runtime } = props;
  const client = useMemo(() => new ViewClient(runtime), [runtime]);
  const value = useMemo(() => ({ runtime, client, schema: view.params }), [runtime, client, view]);
  const search = useSyncExternalStore(
    runtime.params.subscribe,
    () => JSON.stringify(runtime.params.get()),
    () => JSON.stringify(runtime.params.get()),
  );

  if (!runtime.can(view.access)) {
    return props.forbidden ?? createElement("p", { role: "alert" }, "Access denied.");
  }
  if (view.params) {
    const parsed = view.params.safeParse(JSON.parse(search));
    if (!parsed.success) {
      return (
        props.invalidParams?.(parsed.error) ??
        createElement("p", { role: "alert" }, "Invalid parameters.")
      );
    }
  }
  return createElement(ViewContext.Provider, { value }, createElement(view.component));
}
