import type { PixelIcon } from "../types";

// Sun behind a cloud with short wind lines. Sun and cloud of `sun-cloud-01`, raised.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sun-cloud-slow-wind-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..ooo",
    ".ooooo",
    ".ooooo",
    ".ooo..###",
    "....##...#",
    "...#......#",
    "...#......#",
    "....######",
    "",
    "...####",
    "",
    "......####",
  ],
};

export default icon;
