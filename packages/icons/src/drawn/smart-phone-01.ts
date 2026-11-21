import type { PixelIcon } from "../types";

// Phone: a tall body, the home button in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "smart-phone-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#.oo.#",
    "...#....#",
    "...######",
  ],
};

export default icon;
