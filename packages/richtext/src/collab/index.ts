// Yjs helpers: JSON <-> Y.Doc, and a local relay that links documents in memory (tests, the
// gallery, an offline-first app) so collaboration can be shown without a server. No React.

import { prosemirrorJSONToYDoc, yDocToProsemirrorJSON } from "@tiptap/y-tiptap";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import * as Y from "yjs";
import { type RichDoc, emptyDoc, parseDoc } from "../core/model";
import { DEFAULT_FIELD, richTextSchema } from "../tiptap/extensions";

export { DEFAULT_FIELD };

/** An empty shared document; the editor fills it. */
export function createYDoc(): Y.Doc {
  return new Y.Doc();
}

/** A shared document seeded from JSON, to open an existing page for collaboration. */
export function toYDoc(json: RichDoc, field: string = DEFAULT_FIELD): Y.Doc {
  return prosemirrorJSONToYDoc(richTextSchema(), json, field);
}

/** The JSON of the shared document now: what to store next to (or instead of) the Yjs update. */
export function fromYDoc(ydoc: Y.Doc, field: string = DEFAULT_FIELD): RichDoc {
  if (ydoc.share.get(field) === undefined) return emptyDoc();
  return parseDoc(yDocToProsemirrorJSON(ydoc, field));
}

/** One participant of a local session: its document and its presence (who is where). */
export interface LocalPeer {
  doc: Y.Doc;
  awareness: Awareness;
}

export interface LocalSync {
  peers: LocalPeer[];
  readonly connected: boolean;
  /** Stops relaying: the peers keep typing on their own and diverge, like two offline devices. */
  disconnect(): void;
  /** Relays again and exchanges what each missed: the documents converge. */
  connect(): void;
  destroy(): void;
}

const RELAY = Symbol("fg-richtext-relay");

/**
 * Links `count` documents in memory with an update relay, the way a provider would over a network:
 * every local change of one is applied to the others, and so is presence. Starts connected.
 */
export function createLocalSync(count = 2, docs?: ReadonlyArray<Y.Doc | undefined>): LocalSync {
  const peers: LocalPeer[] = Array.from({ length: count }, (_, i) => {
    const doc = docs?.[i] ?? new Y.Doc();
    return { doc, awareness: new Awareness(doc) };
  });
  const cleanups: Array<() => void> = [];
  let connected = false;

  const relay = () => {
    peers.forEach((from, i) => {
      const onUpdate = (update: Uint8Array, origin: unknown) => {
        if (origin === RELAY) return;
        peers.forEach((to, j) => {
          if (j !== i) Y.applyUpdate(to.doc, update, RELAY);
        });
      };
      from.doc.on("update", onUpdate);
      const onAwareness = (
        change: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
      ) => {
        if (origin === RELAY) return;
        const ids = [...change.added, ...change.updated, ...change.removed];
        const payload = encodeAwarenessUpdate(from.awareness, ids);
        peers.forEach((to, j) => {
          if (j !== i) applyAwarenessUpdate(to.awareness, payload, RELAY);
        });
      };
      from.awareness.on("update", onAwareness);
      cleanups.push(
        () => from.doc.off("update", onUpdate),
        () => from.awareness.off("update", onAwareness),
      );
    });
  };

  const exchange = () => {
    for (const a of peers) {
      for (const b of peers) {
        if (a === b) continue;
        Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(b.doc)), RELAY);
        const payload = encodeAwarenessUpdate(a.awareness, [...a.awareness.getStates().keys()]);
        applyAwarenessUpdate(b.awareness, payload, RELAY);
      }
    }
  };

  const sync: LocalSync = {
    peers,
    get connected() {
      return connected;
    },
    connect() {
      if (connected) return;
      connected = true;
      exchange();
      relay();
    },
    disconnect() {
      if (!connected) return;
      connected = false;
      for (const stop of cleanups.splice(0)) stop();
    },
    destroy() {
      sync.disconnect();
      for (const p of peers) {
        p.awareness.destroy();
        p.doc.destroy();
      }
    },
  };
  sync.connect();
  return sync;
}
