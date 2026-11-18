import type { PixelIcon } from "../types";

// Sandwich: two slices of bread with a layer of filling in the secondary tone between them.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sandwich",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    ".#........#",
    ".##########",
    "",
    "oooooooooooo",
    "",
    ".##########",
    ".#........#",
    "..########",
  ],
};

export default icon;
