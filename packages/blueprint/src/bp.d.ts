// Imports of Blueprint files (`*.bp`, JSON), resolved by `@forgeron/blueprint/vite`:
//   import file from "./scene.bp";               // the file as written (BlueprintFile)
//   import compiled from "./scene.bp?compiled";  // its scenes compiled to SceneBin at build time
// A project that imports them adds `/// <reference types="@forgeron/blueprint/bp" />`.
declare module "*.bp" {
  import type { BlueprintFile } from "@forgeron/blueprint/format";
  const file: BlueprintFile;
  export default file;
}

declare module "*.bp?compiled" {
  import type { CompiledBlueprint } from "@forgeron/blueprint/format";
  const compiled: CompiledBlueprint;
  export default compiled;
}
