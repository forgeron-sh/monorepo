import { Icon } from "@forgeron/ui";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { SuggestionSpec } from "../tiptap/plugin";
import { Floating } from "./floating";
import { blockIcon } from "./icons";
import type { SuggestionStore } from "./suggestion-store";

export interface SuggestionMenuProps<T> {
  store: SuggestionStore<T>;
  /** What the menu says and how a candidate looks. */
  spec: Pick<SuggestionSpec<T>, "label" | "empty" | "present">;
}

/**
 * The menu that opens when a trigger character is typed (`/` for blocks, `@` for people): the
 * candidates a plugin provides, filtered as the user types, driven by the arrows, Enter and Escape
 * of the editor (the suggestion plugin owns the keys), or picked with the pointer.
 */
export function SuggestionMenu<T>({ store, spec }: SuggestionMenuProps<T>) {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const active = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    active.current?.scrollIntoView?.({ block: "nearest" });
  }, [state?.index, state?.items]);
  if (!state?.rect) return null;
  return (
    <Floating rect={state.rect} className="fg-pop fg-rt-menu" role="listbox" label={spec.label}>
      <div className="fg-pop-list">
        {state.items.length === 0 ? (
          <p className="fg-rt-menu-empty t-mono">{spec.empty}</p>
        ) : (
          state.items.map((item, i) => {
            const row = spec.present(item);
            return (
              <button
                key={row.key}
                ref={i === state.index ? active : undefined}
                type="button"
                role="option"
                aria-selected={i === state.index}
                className="fg-pop-row"
                data-highlighted={i === state.index ? "" : undefined}
                onMouseEnter={() => store.setIndex(i)}
                onClick={() => state.pick(item)}
              >
                {row.icon ? <Icon icon={blockIcon(row.icon)} size={12} variant="mono" /> : null}
                <span className="fg-pop-label">{row.label}</span>
                {row.hint ? <span className="fg-pop-hint">{row.hint}</span> : null}
              </button>
            );
          })
        )}
      </div>
    </Floating>
  );
}
