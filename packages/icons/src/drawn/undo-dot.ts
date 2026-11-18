import type { PixelIcon } from "../types";

// Undo with a dot: the arrow of `undo-02`, its line ending short of a dot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "undo-dot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...#",
    "..#",
    ".########",
    "..#......#",
    "...#......#",
    "..........#",
    ".........#",
    "..oo..###",
    "..oo",
  ],
};

export default icon;
