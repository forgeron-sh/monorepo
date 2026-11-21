// @forgeron/flow/plugins/docs: the documentation of every bundled plugin as data, for a catalog
// (the site, the gallery) to list them the same way. No React, no canvas.

import { connectionDocs } from "./connection";
import { edgeDocs } from "./edges";
import { graphDocs } from "./graph";
import { interfaceDocs } from "./interface";
import type { PluginDoc } from "./types";

export { connectionDocs, edgeDocs, graphDocs, interfaceDocs };
export type { PluginDoc, PluginDocOption } from "./types";

/** Every bundled plugin, in the order of the `full` preset's families. */
export const flowPluginDocs: ReadonlyArray<PluginDoc> = [
  ...graphDocs.slice(0, 1),
  ...edgeDocs,
  ...connectionDocs,
  ...graphDocs.slice(1),
  ...interfaceDocs,
];
