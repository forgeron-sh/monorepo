import { fromMarkdown } from "@forgeron/richtext";
import { RichTextEditor, createLocalSync, toYDoc, type LocalSync } from "@forgeron/richtext/react";
import "@forgeron/richtext/styles.css";
import { Button } from "@forgeron/ui";
import { useEffect, useState } from "react";

/** Two editors on two Y.Docs linked by an in-memory relay: go offline, edit both, reconnect. */
export default function Collab() {
  const [sync] = useState<LocalSync>(() =>
    createLocalSync(2, [toYDoc(fromMarkdown("# Shared page\n\nEdit here, and there."))]),
  );
  const [connected, setConnected] = useState(true);
  useEffect(() => () => sync.destroy(), [sync]);
  const [ada, grace] = sync.peers as [(typeof sync.peers)[number], (typeof sync.peers)[number]];
  const peers = [
    { peer: ada, name: "Ada", color: "var(--accent)" },
    { peer: grace, name: "Grace", color: "var(--ok)" },
  ];
  return (
    <div className="rt-stack">
      <div className="rt-bar">
        <Button
          size="sm"
          variant={connected ? "secondary" : "primary"}
          onClick={() => {
            if (connected) sync.disconnect();
            else sync.connect();
            setConnected(!connected);
          }}
        >
          {connected ? "Go offline" : "Reconnect"}
        </Button>
        <span className="t-mono dim">
          {connected ? "Connected: edits relay at once" : "Offline: each side keeps its own edits"}
        </span>
      </div>
      <div className="rt-pair">
        {peers.map(({ peer, name, color }) => (
          <div key={name} className="rt-box">
            <p className="t-mono dim rt-who">{name}</p>
            <RichTextEditor
              collaboration={{ doc: peer.doc, provider: peer, user: { name, color } }}
              variant="full"
              blockHandle={false}
              label={`${name}'s page`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
