// The addresses that moved (D-128): an old bookmark, a link in a mail or a page printed before the
// move still lands on the right screen. The rest of the address (a tool's name, `?tab=`, `?invite`)
// is kept. An old path is never a route of its own, so the sidebar and the search never show it.

const MOVED: ReadonlyArray<readonly [from: string, to: string]> = [
  ["/members", "/admin/members"],
  ["/settings/members", "/admin/members"],
  ["/settings/roles", "/admin/roles"],
  ["/audit", "/settings/audit"],
  ["/tools", "/admin/tools"],
  ["/marketplace", "/admin/marketplace"],
];

/**
 * Where an old address now lives, query included; `undefined` for an address that did not move. A
 * path moves with what follows it: `/tools/crm/tree/feat` becomes `/admin/tools/crm/tree/feat`.
 */
export function movedTo(pathname: string, search = ""): string | undefined {
  for (const [from, to] of MOVED) {
    if (pathname === from || pathname === `${from}/`) return to + search;
    if (pathname.startsWith(`${from}/`)) return to + pathname.slice(from.length) + search;
  }
  return undefined;
}
