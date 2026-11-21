// The one way a component of the library holds a value that the caller may own: `value` given,
// the caller owns it; `value` absent, the component keeps its own, starting at `defaultValue`.
// Either way `onChange` hears every change.

import { useState } from "react";

export interface ControllableOptions<T> {
  /** The value, when the caller owns it. */
  value?: T | undefined;
  /** The first value, when the component owns it. */
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
}

/**
 * `[value, setValue]`, like `useState`, for a value the caller may control. `setValue` takes a
 * value or a function of the current one, and calls `onChange` only when the value changes.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableOptions<T>): [T, (next: T | ((current: T) => T)) => void] {
  const [own, setOwn] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : own;
  // A function of the value of this render: two updates in the same event see the same value.
  const setValue = (next: T | ((current: T) => T)) => {
    const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
    if (Object.is(resolved, current)) return;
    if (!controlled) setOwn(resolved);
    onChange?.(resolved);
  };
  return [current, setValue];
}
