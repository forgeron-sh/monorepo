import type { PixelIcon } from "../types";

// Send mail: an envelope and an arrow leaving it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-send-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".##......##",
    ".#.##..##.#",
    ".#...##...#",
    ".#........#",
    ".##########",
    "",
    ".........o",
    "......ooooo",
    ".........o",
  ],
};

export default icon;
