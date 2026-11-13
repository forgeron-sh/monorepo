import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ApiError, type Api } from "./api";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let mounted: Array<{ root: Root; container: HTMLElement }> = [];

/** Renders into the document and waits for the first answers. */
export async function mount(element: ReactNode): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mounted.push({ root, container });
  await act(async () => root.render(element));
  await flush();
  return container;
}

export async function cleanup() {
  for (const { root, container } of mounted) {
    await act(async () => root.unmount());
    container.remove();
  }
  mounted = [];
  document.body.innerHTML = "";
}

export const flush = () => act(async () => {});

export const click = (element: Element | null | undefined) =>
  act(async () => (element as HTMLElement).click());

export const button = (scope: ParentNode, label: string): HTMLButtonElement =>
  [...scope.querySelectorAll("button, a")].find(
    (b) => b.textContent?.trim() === label,
  ) as HTMLButtonElement;

/** Types into a React-controlled input. */
export const type = (input: HTMLInputElement | HTMLTextAreaElement, value: string) =>
  act(async () => {
    const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

export const field = (scope: ParentNode, label: string) =>
  [...scope.querySelectorAll("label")]
    .filter((l) => l.textContent?.trim().startsWith(label))
    .map((l) =>
      scope.querySelector<HTMLInputElement>(`#${CSS.escape(l.htmlFor)}`),
    )[0] as HTMLInputElement;

export const submit = (form: Element | null | undefined) =>
  act(async () => {
    form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });

export type Sent = Array<{ path: string; body: unknown; method: string }>;

/**
 * An `Api` that answers from a table: `"/api/members"` for a read, `"POST /api/invitations"` for a
 * write. A value or a function of the body; an unknown route is a 404, an `ApiError` thrown is a refusal.
 */
export function fakeApi(routes: Record<string, unknown>): {
  api: Api;
  sent: Sent;
  reads: string[];
} {
  const sent: Sent = [];
  const reads: string[] = [];
  const answer = async (key: string, body?: unknown) => {
    if (!(key in routes)) throw new ApiError(`${key}: 404`, 404);
    const value = routes[key];
    return typeof value === "function" ? (value as (b: unknown) => unknown)(body) : value;
  };
  return {
    sent,
    reads,
    api: {
      fetchJson: async (path) => {
        reads.push(path);
        return answer(path);
      },
      sendJson: async (path, body, method = "PUT") => {
        sent.push({ path, body, method });
        return answer(`${method} ${path}`, body);
      },
    },
  };
}

export const refusal = (status: number, detail?: string, code?: string) =>
  new ApiError(`${status}${detail ? ` ${detail}` : ""}`, status, detail, code);

export const NOW = new Date("2026-11-03T12:00:00Z");

/** The teams of a workspace as `GET /api/teams` answers them: the built-in ones, then two of its own. */
export const TEAMS = [
  {
    id: "admin",
    name: "Admins",
    description: "Administer the workspace",
    members: ["m1"],
    builtIn: true,
    locked: true,
    permissions: ["*"],
    effective: [
      "tools:read",
      "tools:write",
      "tools:publish",
      "tools:approve",
      "tools:data",
      "tools:secrets",
      "tools:delete",
      "access:read",
      "access:write",
      "members:read",
      "members:write",
      "teams:write",
      "marketplace:read",
      "marketplace:write",
      "settings:read",
      "settings:write",
      "audit:read",
      "usage:read",
      "platform:update",
    ],
  },
  {
    id: "developer",
    name: "Developers",
    description: "Build and publish tools",
    members: ["m2"],
    builtIn: true,
    locked: false,
    permissions: ["tools:write", "access:read"],
    effective: ["tools:read", "tools:write", "access:read"],
  },
  {
    id: "support",
    name: "Support",
    description: "",
    members: ["m3"],
    builtIn: false,
    locked: false,
    permissions: [],
    effective: [],
  },
];
