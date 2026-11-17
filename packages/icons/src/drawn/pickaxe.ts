import type { PixelIcon } from "../types";

// Pickaxe upright: a curved solid head with pointed ends over a two-pixel handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pickaxe",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..########",
    ".###.##.###",
    "##...##...##",
    "#....##....#",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
