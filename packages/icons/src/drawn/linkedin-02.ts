import type { PixelIcon } from "../types";

// The LinkedIn letters in on their own, without the square.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "linkedin-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    "..##",
    "",
    "..##.####",
    "..##.#####",
    "..##.##.##",
    "..##.##.##",
    "..##.##.##",
    "..##.##.##",
    "..##.##.##",
  ],
};

export default icon;
