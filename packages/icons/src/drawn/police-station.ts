import type { PixelIcon } from "../types";

// Police station: `building-01` with a beacon on its roof in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "police-station",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "..########",
    "..#......#",
    "..#.#..#.#",
    "..#......#",
    "..#.#..#.#",
    "..#......#",
    "..#..##..#",
    "..#..##..#",
    ".##########",
  ],
};

export default icon;
