import type { PixelIcon } from "../types";

// Radiation: the trefoil, three solid blades round a centre dot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "radiation",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#......#",
    ".###....###",
    "####....####",
    "####....####",
    "###..##..###",
    ".....##",
    "",
    "....####",
    "...######",
    "...######",
    "....####",
  ],
};

export default icon;
