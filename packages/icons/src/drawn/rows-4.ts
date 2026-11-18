import type { PixelIcon } from "../types";

// Four rows: four solid horizontal bars stacked.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rows-4",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".##########",
    "",
    ".##########",
    ".##########",
    "",
    ".##########",
    ".##########",
    "",
    ".##########",
    ".##########",
  ],
};

export default icon;
