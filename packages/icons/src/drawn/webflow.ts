import type { PixelIcon } from "../types";

// The Webflow mark: a solid slanted W made of two strokes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "webflow",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "###..##..###",
    "###.###.###",
    "##########",
    "#########",
    "####.###",
    "###..##",
  ],
};

export default icon;
