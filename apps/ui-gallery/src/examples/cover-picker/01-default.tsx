// The parts of the panel: here the gallery only, with no upload or link tab to switch to.
import {
  CoverArt,
  CoverPicker,
  CoverPickerError,
  CoverPickerGallery,
  CoverPickerStage,
  type CoverValue,
} from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [cover, setCover] = useState<CoverValue | null>(null);
  return (
    <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 440 }}>
      <CoverPicker value={cover} onChange={setCover} upload={false} link={false}>
        <CoverPickerStage />
        <CoverPickerGallery />
        <CoverPickerError />
      </CoverPicker>
      {cover ? <CoverArt value={cover} height={72} /> : null}
    </div>
  );
}
