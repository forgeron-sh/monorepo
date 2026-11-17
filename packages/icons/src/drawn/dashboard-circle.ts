import type { PixelIcon } from "../types";

// Dashboard gauge: the upper ten rows of the ring of `circle`, open at the bottom, a hub and the needle in
// the secondary tone (a full ring read as a clock; side ticks made it a face).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashboard-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    ".#......o.#",
    "#......o...#",
    "#....##....#",
    "#....##....#",
    "#..........#",
    ".#........#",
    ".#........#",
  ],
};

export default icon;
