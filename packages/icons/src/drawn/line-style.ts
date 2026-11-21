import type { PixelIcon } from "../types";

// Line style: a short-dashed, a long-dashed and a solid line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "line-style",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##..##..##",
    "",
    "",
    ".####..####",
    "",
    "",
    ".##########",
  ],
};

export default icon;
