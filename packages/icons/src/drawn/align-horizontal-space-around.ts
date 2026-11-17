import type { PixelIcon } from "../types";

// Space around: one bar centred between two edge lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-horizontal-space-around",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o........o",
    ".o........o",
    ".o..####..o",
    ".o..#..#..o",
    ".o..#..#..o",
    ".o..#..#..o",
    ".o..#..#..o",
    ".o..####..o",
    ".o........o",
    ".o........o",
  ],
};

export default icon;
