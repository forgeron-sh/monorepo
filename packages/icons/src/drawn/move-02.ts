import type { PixelIcon } from "../types";

// Move: four solid arrowheads pointing outwards around a centre dot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "move-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....####",
    "",
    "",
    ".#........#",
    "##...oo...##",
    "##...oo...##",
    ".#........#",
    "",
    "",
    "....####",
    ".....##",
  ],
};

export default icon;
