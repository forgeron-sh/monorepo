import { components } from "../lib/examples";

/** One example, rendered by id: a single island type for every example of the gallery. */
export default function Demo({ id }: { id: string }) {
  const Component = components[id];
  return Component ? <Component /> : null;
}
