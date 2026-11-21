import type { PixelIcon } from "../types";

// Arrow pointing left: `arrow-right-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-left-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....##",
    "...##",
    "..##",
    ".##########",
    ".##########",
    "..##",
    "...##",
    "....##",
  ],
};

export default icon;
