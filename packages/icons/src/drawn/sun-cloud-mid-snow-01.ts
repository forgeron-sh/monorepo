import type { PixelIcon } from "../types";

// Sun behind a cloud with snowflakes. Sun and cloud of `sun-cloud-01`, raised.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sun-cloud-mid-snow-01",
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
    ".....#...#",
    "....###.###",
    ".....#...#",
  ],
};

export default icon;
