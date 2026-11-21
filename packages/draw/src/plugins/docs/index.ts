// The documentation of every bundled plugin, as data: the gallery lists them from here.

import { exportDocs } from "./export";
import { interfaceDocs } from "./interface";
import { layoutDocs } from "./layout";
import { linesDocs } from "./lines";
import { mediaDocs } from "./media";
import { notesDocs } from "./notes";
import { shapesDocs } from "./shapes";
import type { PluginDoc } from "./types";

export { exportDocs, interfaceDocs, layoutDocs, linesDocs, mediaDocs, notesDocs, shapesDocs };
export type { PluginDoc, PluginDocOption } from "./types";

/** Every plugin's doc, in the order of the dock. */
export const pluginDocs: ReadonlyArray<PluginDoc> = [
  ...shapesDocs,
  ...notesDocs,
  ...linesDocs,
  ...layoutDocs,
  ...mediaDocs,
  ...exportDocs,
  ...interfaceDocs,
];
