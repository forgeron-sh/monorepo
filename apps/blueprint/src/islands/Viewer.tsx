import { BlueprintViewer } from "@forgeron/blueprint/canvas";
import { library } from "@forgeron/libraries/blueprints";

// The P5 viewer on the library (each file loaded when opened). `?file=name.bp` opens that file
// (the library page links here); a dropped or picked file opens in the page, never uploaded.

const DEFAULT = "erp-village.bp";

function initialFile(): string {
  const asked = new URLSearchParams(window.location.search).get("file");
  return asked && library.some((f) => f.name === asked) ? asked : DEFAULT;
}

export default function Viewer() {
  return <BlueprintViewer library={library} initial={initialFile()} />;
}
