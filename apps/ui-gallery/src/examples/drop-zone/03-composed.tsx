import {
  DropZone,
  DropZoneDescription,
  DropZoneIcon,
  DropZoneTitle,
  DropZoneTrigger,
} from "@forgeron/ui";
import { useState } from "react";

export default function Composed() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div style={{ display: "grid", gap: 8, width: "100%", maxWidth: 420 }}>
      <DropZone accept="image/*" onDropFiles={(files) => setNames(files.map((f) => f.name))}>
        <DropZoneIcon />
        <DropZoneTitle>Drop your logo</DropZoneTitle>
        <DropZoneDescription>PNG, JPEG or SVG.</DropZoneDescription>
        <DropZoneTrigger>Choose an image</DropZoneTrigger>
      </DropZone>
      <span style={{ font: "400 11px/16px var(--font-mono)" }}>{names.join(", ")}</span>
    </div>
  );
}
