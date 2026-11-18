import type { PixelIcon } from "../types";

// Hotel bell: a dome on a base, the push button in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hotel-bell",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".....oo",
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    ".#........#",
    "############",
  ],
};

export default icon;
