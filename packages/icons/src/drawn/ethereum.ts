import type { PixelIcon } from "../types";

// The Ethereum mark: a solid upper diamond over a two-pixel chevron that closes in a point.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ethereum",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".....##",
    "....####",
    "....####",
    "...######",
    "...######",
    "....####",
    "..#..##..#",
    "..##....##",
    "...##..##",
    "....####",
    ".....##",
  ],
};

export default icon;
