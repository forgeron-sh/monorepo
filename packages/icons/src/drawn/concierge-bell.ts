import type { PixelIcon } from "../types";

// A concierge bell: a dome with a knob, on a base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "concierge-bell",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#..........#",
    "############",
    "",
    ".##########",
  ],
};

export default icon;
