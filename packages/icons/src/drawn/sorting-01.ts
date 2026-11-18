import type { PixelIcon } from "../types";

// Sort: four bars getting shorter, aligned left, two-pixel gaps.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sorting-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    ".########",
    "",
    "",
    ".######",
    "",
    "",
    ".####",
  ],
};

export default icon;
