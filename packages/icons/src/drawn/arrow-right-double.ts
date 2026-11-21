import type { PixelIcon } from "../types";

// Double chevron pointing right: two chevrons of two-pixel runs, six rows tall, two pixels apart.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-right-double",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..##..##",
    "...##..##",
    "....##..##",
    "....##..##",
    "...##..##",
    "..##..##",
  ],
};

export default icon;
