import { useEffect, useRef, useSyncExternalStore } from "react";
import type { BlockDef } from "../core/blocks";
import { Icon } from "@forgeron/ui";
import { Floating } from "./floating";
import { blockIcon } from "./icons";
import type { SuggestionStore } from "./suggestion-store";

export interface SlashMenuProps {
  store: SuggestionStore<BlockDef>;
}

/**
 * The block list that opens when "/" is typed: filtered by what follows, driven by the arrows,
 * Enter and Escape of the editor (the suggestion plugin owns the keys), or picked with the pointer.
 */
export function SlashMenu({ store }: SlashMenuProps) {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const active = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    active.current?.scrollIntoView?.({ block: "nearest" });
  }, [state?.index, state?.items]);
  if (!state?.rect) return null;
  return (
    <Floating rect={state.rect} className="fg-pop fg-rt-menu" role="listbox" label="Insert a block">
      <div className="fg-pop-list">
        {state.items.length === 0 ? (
          <p className="fg-rt-menu-empty t-mono">No block matches</p>
        ) : (
          state.items.map((block, i) => (
            <button
              key={block.id}
              ref={i === state.index ? active : undefined}
              type="button"
              role="option"
              aria-selected={i === state.index}
              className="fg-pop-row"
              data-highlighted={i === state.index ? "" : undefined}
              onMouseEnter={() => store.setIndex(i)}
              onClick={() => state.pick(block)}
            >
              <Icon icon={blockIcon(block.icon)} size={12} variant="mono" />
              <span className="fg-pop-label">{block.label}</span>
              {block.shortcut ? <span className="fg-pop-hint">{block.shortcut}</span> : null}
            </button>
          ))
        )}
      </div>
    </Floating>
  );
}
