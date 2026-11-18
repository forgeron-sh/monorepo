import type { PixelIcon } from "../types";

// Font: a capital A next to a small a, in the bold letter style of text-color.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-font",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".####",
    "##..##",
    "##..##.####",
    "######....##",
    "##..##..####",
    "##..##.##.##",
    "##..##..####",
  ],
};

export default icon;
