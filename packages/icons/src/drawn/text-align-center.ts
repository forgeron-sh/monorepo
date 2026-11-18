import type { PixelIcon } from "../types";

// Text centred: four lines, long and short, two-pixel gaps.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-align-center",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    "...######",
    "",
    "",
    ".##########",
    "",
    "",
    "...######",
  ],
};

export default icon;
