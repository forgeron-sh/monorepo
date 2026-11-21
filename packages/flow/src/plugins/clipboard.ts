// The clipboard as a plugin: a copy is flow JSON (the selected nodes, the edges between them and
// the groups wholly inside), a paste reads it back under new ids. Flow JSON is the one format, so a
// copy pastes into another flow, another tab, or a text field. Without it a graph has no copy.

import type { Point } from "@forgeron/canvas";
import { extractSubgraph, pasteSubgraph } from "../core/edit";
import type { FlowGraph } from "../core/model";
import { definePlugin, type ClipboardSpec } from "../core/plugin";
import { FlowFormatError, parseFlow, serializeFlow } from "../core/serialize";

export const flowClipboard: ClipboardSpec = {
  copy: (graph, ids) => serializeFlow(extractSubgraph(graph, ids)),
  read: <D>(text: string): FlowGraph<D> | null => {
    try {
      return parseFlow<D>(text);
    } catch (e) {
      if (e instanceof FlowFormatError) return null;
      throw e;
    }
  },
  paste: <D>(graph: FlowGraph<D>, fragment: FlowGraph<D>, offset: Point) =>
    pasteSubgraph(graph, fragment, offset),
};

export const clipboard = definePlugin({
  id: "clipboard",
  name: "Clipboard",
  description:
    "Copy, cut, paste and duplicate: the selected nodes and the edges between them as flow JSON, on the system clipboard.",
  clipboard: flowClipboard,
});
