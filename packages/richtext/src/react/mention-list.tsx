import { useEffect, useRef, useSyncExternalStore } from "react";
import type { MentionItem } from "../core/blocks";
import { Floating } from "./floating";
import type { SuggestionStore } from "./suggestion-store";

export interface MentionListProps {
  store: SuggestionStore<MentionItem>;
}

/** The list that opens when "@" is typed: the items the caller provides, filtered as it types. */
export function MentionList({ store }: MentionListProps) {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const active = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    active.current?.scrollIntoView?.({ block: "nearest" });
  }, [state?.index, state?.items]);
  if (!state?.rect) return null;
  return (
    <Floating rect={state.rect} className="fg-pop fg-rt-menu" role="listbox" label="Mention">
      <div className="fg-pop-list">
        {state.items.length === 0 ? (
          <p className="fg-rt-menu-empty t-mono">No one matches</p>
        ) : (
          state.items.map((item, i) => (
            <button
              key={item.id}
              ref={i === state.index ? active : undefined}
              type="button"
              role="option"
              aria-selected={i === state.index}
              className="fg-pop-row"
              data-highlighted={i === state.index ? "" : undefined}
              onMouseEnter={() => store.setIndex(i)}
              onClick={() => state.pick(item)}
            >
              <span className="fg-pop-label">{item.label}</span>
              {item.hint ? <span className="fg-pop-hint">{item.hint}</span> : null}
            </button>
          ))
        )}
      </div>
    </Floating>
  );
}
