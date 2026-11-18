import type { PixelIcon } from "../types";

// Tally mark: a single upright stroke, the first of a count.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tally-1",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
  ],
};

export default icon;
