import type { PixelIcon } from "../types";

// The Figma mark: two rounded pieces on top, a piece and a circle in the middle, a drop at the
// bottom, in alternating tones.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "figma",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...###.ooo",
    "..####.oooo",
    "..####.oooo",
    "...###.ooo",
    "...ooo..##",
    "..oooo.####",
    "..oooo.####",
    "...ooo..##",
    "...###",
    "..####",
    "..####",
    "...##",
  ],
};

export default icon;
