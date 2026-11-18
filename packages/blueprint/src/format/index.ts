// @forgeron/blueprint/format: the `.bp.json` format. Types, the schema, the reader (validation
// and imports), the writer, the still-picture evaluator (`flatten`) and the mechanical converter.
// Pure TypeScript, like the core: no DOM, no Node module.

export {
  blockKey,
  blockToPrim,
  type ConvertOptions,
  type Converted,
  convertScene,
  normalizeBlock,
  type Sample,
  type SceneReport,
  staticBlocks,
  staticCounts,
} from "./convert";
export { flatten } from "./flatten";
export { type Library, type ReadOptions, readBlueprint, resolveLocation } from "./read";
export { type JsonSchema, SCHEMA } from "./schema";
export type * from "./types";
export { FORMAT_VERSION, SCHEMA_URL } from "./types";
export { schemaErrors, validate } from "./validate";
export { formatJson, writeBlueprint } from "./write";
