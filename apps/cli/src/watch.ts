import { watch } from "node:fs";
import { sep } from "node:path";

const IGNORED = ["node_modules", ".git", ".forgeron"];

/** Calls `onChange` once after a burst of changes to the sources of `dir`. */
export function watchSources(dir: string, onChange: () => void, delay = 200): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const watcher = watch(dir, { recursive: true }, (_event, file) => {
    if (!file || IGNORED.some((name) => file.split(sep).includes(name))) return;
    clearTimeout(timer);
    timer = setTimeout(onChange, delay);
  });
  return () => {
    clearTimeout(timer);
    watcher.close();
  };
}
