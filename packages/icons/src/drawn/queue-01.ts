import type { PixelIcon } from "../types";

// Queue: three people standing in a line, the first one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "queue-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".o...#...#",
    "ooo.###.###",
    ".o...#...#",
    "",
    "ooo.###.###",
    "ooo.###.###",
    "ooo.###.###",
    "ooo.###.###",
  ],
};

export default icon;
