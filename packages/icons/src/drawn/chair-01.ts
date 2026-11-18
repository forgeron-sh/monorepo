import type { PixelIcon } from "../types";

// Chair seen from the side: a tall back, a seat and two legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chair-01",
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
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
  ],
};

export default icon;
