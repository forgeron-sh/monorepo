import { Dialog, Input } from "@forgeron/ui";
import { useState } from "react";

export interface Destination {
  title: string;
  /** Where it lives: "Settings · Workspace". */
  where: string;
  href: string;
}

/** `/`: a field and the places a person may go; Enter opens the first match. */
export function SearchDialog({
  destinations,
  onGo,
  onClose,
}: {
  destinations: ReadonlyArray<Destination>;
  onGo: (href: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const needle = text.trim().toLowerCase();
  const matches = destinations.filter(
    (d) => !needle || `${d.title} ${d.where}`.toLowerCase().includes(needle),
  );
  const open = (href: string) => {
    onClose();
    onGo(href);
  };
  return (
    <Dialog title="Go to" onClose={onClose}>
      <div className="fc-stack">
        <Input
          data-autofocus
          aria-label="Search pages"
          placeholder="Search pages"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && matches[0]) open(matches[0].href);
          }}
        />
        {matches.length === 0 ? (
          <p className="fc-muted" style={{ margin: 0 }}>
            No page matches “{text}”.
          </p>
        ) : (
          <ul className="fc-results">
            {matches.map((d) => (
              <li key={d.href}>
                <a
                  href={d.href}
                  className="fc-result"
                  onClick={(e) => {
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
                    e.preventDefault();
                    open(d.href);
                  }}
                >
                  <span>{d.title}</span>
                  <span className="fc-muted">{d.where}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
