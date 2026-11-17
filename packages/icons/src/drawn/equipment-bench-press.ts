import type { PixelIcon } from "../types";

// A bench press: a barbell with plates over a flat bench.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "equipment-bench-press",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    "##........##",
    "############",
    "############",
    "##........##",
    ".#........#",
    "",
    "..########",
    "..########",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
