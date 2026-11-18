import type { PixelIcon } from "../types";

// A street food stall: an awning over a counter on two wheels in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "street-food",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "#..#..#..#.#",
    "############",
    ".#........#",
    ".#........#",
    ".##########",
    ".#........#",
    ".##########",
    "..oo....oo",
    "..oo....oo",
  ],
};

export default icon;
