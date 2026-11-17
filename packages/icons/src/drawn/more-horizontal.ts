import type { PixelIcon } from "../types";

// Three 2×2 dots, two-pixel gaps.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "more-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "",
    ".##..##..##",
    ".##..##..##",
  ],
};

export default icon;
