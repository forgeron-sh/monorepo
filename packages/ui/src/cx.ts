/** What `cn` takes: the clsx shapes (strings, numbers, arrays, `{ class: condition }` objects). */
export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | ReadonlyArray<ClassValue>
  | { readonly [className: string]: unknown };

function push(out: string[], value: ClassValue): void {
  if (!value || value === true) return;
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    out.push(String(value));
  } else if (Array.isArray(value)) {
    for (const v of value as ReadonlyArray<ClassValue>) push(out, v);
  } else {
    for (const [name, on] of Object.entries(value)) if (on) out.push(name);
  }
}

/**
 * Joins class names, the way shadcn's `cn` does (clsx shapes). No Tailwind merge: our classes are
 * `fg-*`, and your Tailwind utilities win over them by the cascade (D-156).
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const v of inputs) push(out, v);
  return out.join(" ");
}

/** The name the components use; does what `cn` does. */
export function cx(...inputs: ClassValue[]): string {
  return cn(...inputs);
}
