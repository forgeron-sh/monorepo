// The panel of the dates plugin: a calendar and an optional time, in the place the caret was when
// "Pick a date" was chosen. It is an interface plugin, `datesPanel`: the dates plugin (editor half)
// opens it, this draws it, so the dates plugin itself loads no React. Made of the Calendar and the
// TimePicker of `@forgeron/ui`.

import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import { Button, Calendar, TimePicker } from "@forgeron/ui";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { definePlugin } from "../core/plugin";
import { type DateParts, dateId } from "../plugins/dates";
import { type DatesPanelState, datesPanelFor } from "../plugins/editor/dates";
import { insertReference } from "../plugins/editor/references-kit";
import { defineEditorPlugin } from "../tiptap/plugin";
import { Floating } from "./floating";

function PanelBody({ editor, state }: { editor: Editor; state: DatesPanelState }) {
  const store = datesPanelFor(editor);
  const [date, setDate] = useState<string | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const close = () => {
    store.close();
    editor.chain().focus().run();
  };
  const insert = () => {
    if (!date) return;
    const parts: DateParts = time ? { date, time } : { date };
    store.close();
    insertReference(
      editor,
      { from: state.pos, to: state.pos },
      { kind: "date", id: dateId(parts), label: state.format(parts) },
    );
  };

  // A press outside the panel dismisses it, like Escape.
  useEffect(() => {
    const away = (event: PointerEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) store.close();
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [store]);

  return (
    <Floating
      rect={state.rect}
      className="fg-pop fg-rt-datepanel"
      role="dialog"
      label={state.title}
      keepFocus={false}
    >
      <div
        ref={box}
        className="fg-rt-datepanel-body"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
      >
        <Calendar
          label={state.title}
          today={state.today}
          {...(date ? { value: date } : {})}
          onChange={setDate}
        />
        <div className="fg-rt-datepanel-time">
          <TimePicker label="Time (optional)" value={time} onChange={setTime} />
        </div>
        <div className="fg-rt-datepanel-actions">
          <Button size="sm" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" disabled={!date} onClick={insert}>
            Insert
          </Button>
        </div>
      </div>
    </Floating>
  );
}

function DatesPanelHost({ editor }: { editor: Editor }) {
  const store = datesPanelFor(editor);
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  useEffect(() => {
    const follow = ({ transaction }: { transaction: Transaction }) => store.map(transaction);
    editor.on("transaction", follow);
    return () => void editor.off("transaction", follow);
  }, [editor, store]);
  return state ? <PanelBody key={state.id} editor={editor} state={state} /> : null;
}

/** Draws the calendar panel the dates plugin opens. List it next to `datesEditor(...)`. */
export const datesPanel = defineEditorPlugin({
  core: definePlugin({
    id: "datesPanel",
    name: "Date panel",
    description: "The calendar and time panel behind `!` and Pick a date.",
    requires: ["dates"],
  }),
  ui: [{ id: "dates-panel", Component: ({ editor }) => <DatesPanelHost editor={editor} /> }],
});
