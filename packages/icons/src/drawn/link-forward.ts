import type { PixelIcon } from "../types";

// Link forward: a link bracket on the left and an arrow in the secondary tone leaving it, the arrow of arrow-right-02.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "link-forward",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......oo",
    "..###..oo",
    ".#......oo",
    ".#.oooooooo",
    ".#.oooooooo",
    ".#......oo",
    "..###..oo",
    "......oo",
  ],
};

export default icon;
