import type { PixelIcon } from "../types";

// Envelope with a shallow 2:1 flap and a reply arrow badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-reply-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".##......##",
    ".#.##..##.#",
    ".#...##...#",
    ".#",
    ".#.....o",
    ".#....oooo",
    ".####..o..o",
    "..........o",
    "..........o",
  ],
};

export default icon;
