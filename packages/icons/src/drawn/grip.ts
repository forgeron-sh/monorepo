import type { PixelIcon } from "../types";

// A three-by-three grid of dots used as a drag handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "grip",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".##..##..##",
    "",
    "",
    ".##..##..##",
    ".##..##..##",
    "",
    "",
    ".##..##..##",
    ".##..##..##",
  ],
};

export default icon;
