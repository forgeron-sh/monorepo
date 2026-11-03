/** The address of a route, parameters encoded: `hrefOf("/tools/:name", { name: "a b" })`. */
export const hrefOf = (path: string, params: Record<string, string> = {}) =>
  path.replace(/:(\w+)/g, (_, name: string) => encodeURIComponent(params[name] ?? ""));
