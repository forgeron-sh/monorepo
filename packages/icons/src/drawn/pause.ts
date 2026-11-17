import type { PixelIcon } from "../types";

// Pause: two solid bars, two pixels wide, like the chevrons' weight.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pause",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...##..##",
    "...##..##",
    "...##..##",
    "...##..##",
    "...##..##",
    "...##..##",
    "...##..##",
    "...##..##",
  ],
};

export default icon;
