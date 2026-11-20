// Frames, editor half: the frame tool (F), its name in the strip, the clip that cuts what reaches
// outside the frame, and the name panel.

import { FrameIcon } from "@forgeron/icons";
import { Input } from "@forgeron/ui";
import type { FrameData } from "../../core/types";
import { Section } from "../../react/kit";
import { defineEditorPlugin, type KindView, type PanelProps } from "../../react/plugin";
import { frame as frameCore, frameItem } from "../frame";
import { boxTool } from "./kit";

const frameView: KindView = {
  minimapColor: "--line-strong",
  // The GPU draws the name; this is the DOM view's.
  content(item, o) {
    if (o.overlay) return null;
    const d = item.data as FrameData;
    return (
      <span className="fgd-frame-name" title={d.name}>
        {d.name}
      </span>
    );
  },
};

function FramePanel({ selected, dataOf, edit }: PanelProps) {
  const d = dataOf<FrameData>("frame");
  return selected.length === 1 && d ? (
    <Section title="Name">
      <Input
        aria-label="Frame name"
        value={d.name}
        onChange={(e) => {
          const name = e.currentTarget.value;
          edit("name", (i) => (i.data.type === "frame" ? { data: { ...i.data, name } } : null));
        }}
      />
    </Section>
  ) : null;
}

export const frame = defineEditorPlugin({
  core: frameCore,
  kinds: { frame: frameView },
  clip: { type: "frame", field: "frame" },
  panels: [{ id: "frame", type: "frame", Component: FramePanel }],
  tools: (ctx) => [
    boxTool(
      "frame",
      "Frame",
      "f",
      (b) =>
        frameItem(
          b,
          `Frame ${ctx.store.getState().items.filter((i) => i.kind === "frame").length + 1}`,
        ),
      { w: 480, h: 320 },
      { dock: { icon: FrameIcon, group: "frame" } },
    ),
  ],
});
