import type { PixelIcon } from "../types";

// Bold B: two-pixel stem, two bowls.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-bold",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..######",
    "..##...##",
    "..##...##",
    "..##...##",
    "..#######",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
    "..#######",
  ],
};

export default icon;
