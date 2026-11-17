import type { PixelIcon } from "../types";

// Link: two brackets facing each other, joined by a bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the bar between the links.
const icon: PixelIcon = {
  name: "link-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".####..####",
    "#..........#",
    "#..........#",
    "#..oooooo..#",
    "#..........#",
    "#..........#",
    ".####..####",
  ],
};

export default icon;
