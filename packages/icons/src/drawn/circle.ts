import type { PixelIcon } from "../types";

// A ring that uses the full grid, its quarter arcs stepping 4, 2, 2, 4 so it reads round at 48 px
// rather than octagonal.
// Redrawn after Hugeicons `circle` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
