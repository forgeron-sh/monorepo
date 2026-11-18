// The sources of the examples, read at build time only (Astro frontmatter): never shipped to the client.

const raw = import.meta.glob<string>("../examples/*/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const sourceOf = (id: string): string => raw[`../examples/${id}.tsx`] ?? "";
