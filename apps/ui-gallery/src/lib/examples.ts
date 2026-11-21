import type { ComponentType } from "react";

// Every example of `src/examples/<slug>/<nn>-<name>.tsx`: the component to render and, apart, its
// source to show. The file name orders the examples and gives their title.

export interface Example {
  /** `button/01-variants`. */
  id: string;
  slug: string;
  title: string;
}

const modules = import.meta.glob<{ default: ComponentType }>("../examples/*/*.tsx", {
  eager: true,
});

const idOf = (path: string) => path.replace("../examples/", "").replace(/\.tsx$/, "");

export const components: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [idOf(path), mod.default]),
);

const titleOf = (file: string) => {
  const words = file.replace(/^\d+-/, "").replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export function examplesOf(slug: string): Example[] {
  return Object.keys(components)
    .filter((id) => id.startsWith(`${slug}/`))
    .sort()
    .map((id) => ({ id, slug, title: titleOf(id.slice(slug.length + 1)) }));
}
