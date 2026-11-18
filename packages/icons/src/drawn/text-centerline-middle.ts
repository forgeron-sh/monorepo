import type { PixelIcon } from "../types";

// Box centred between two rules, margin ticks either side: the box in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-centerline-middle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    "",
    "",
    "##..oooo..##",
    "....o..o",
    "....o..o",
    "##..oooo..##",
    "",
    "",
    "############",
  ],
};

export default icon;
