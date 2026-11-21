import type { PixelIcon } from "../types";

// Record: a solid disc in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "record",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....####",
    "...######",
    "..########",
    "..########",
    "..########",
    "..########",
    "...######",
    "....####",
  ],
};

export default icon;
