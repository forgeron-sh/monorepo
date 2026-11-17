import type { PixelIcon } from "../types";

// A solid two-pixel line across the grid: the solid line style.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "solid-line-01",
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
    ".##########",
    ".##########",
  ],
};

export default icon;
