import type { PixelIcon } from "../types";

// The TypeScript mark: a solid square with the letters TS cut out of its lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "typescript-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".##########",
    ".##########",
    ".##########",
    ".##...##..#",
    ".###.##.###",
    ".###.###.##",
    ".###.####.#",
    ".###.##..##",
    ".##########",
  ],
};

export default icon;
