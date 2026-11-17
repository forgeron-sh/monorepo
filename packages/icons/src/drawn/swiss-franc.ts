import type { PixelIcon } from "../types";

// Franc sign: an F with a two-pixel upright and a bar crossing its stem, like `dollar-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swiss-franc",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#######",
    "...##",
    "...##",
    "...######",
    "...##",
    "...##",
    ".######",
    "...##",
    "...##",
    "...##",
  ],
};

export default icon;
