import type { PixelIcon } from "../types";

// Rewind: two solid triangles pointing left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "backward-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....#.....#",
    "...##....##",
    "..###...###",
    ".####..####",
    ".####..####",
    "..###...###",
    "...##....##",
    "....#.....#",
  ],
};

export default icon;
