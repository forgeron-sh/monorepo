import type { PixelIcon } from "../types";

// Queue moving forward: three people in a line over an arrow pointing to the front in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "queue-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#...#...#",
    "###.###.###",
    ".#...#...#",
    "",
    "###.###.###",
    "###.###.###",
    "###.###.###",
    "",
    "..o",
    ".oooooooooo",
    "..o",
  ],
};

export default icon;
