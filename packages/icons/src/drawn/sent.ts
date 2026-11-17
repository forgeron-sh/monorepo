import type { PixelIcon } from "../types";

// Paper plane heading up and right: two wings in steady 3:1 and 2:1 steps, symmetric about the
// diagonal, a two-pixel crease from the inner notch towards the tip.
// Redrawn after Hugeicons `sent` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sent",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........###",
    ".....###..#",
    "..###.....#",
    ".#.....#.#",
    "..##..#..#",
    "....##...#",
    ".....#..#",
    "......#.#",
    "......#.#",
    ".......#",
  ],
};

export default icon;
