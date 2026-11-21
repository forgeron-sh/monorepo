import type { PixelIcon } from "../types";

// Traffic light: a tall housing and three lamps, the lit one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "traffic-light",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "...#....#",
    "...#.oo.#",
    "...#.oo.#",
    "...#....#",
    "...#.##.#",
    "...#.##.#",
    "...#....#",
    "...#.##.#",
    "...#.##.#",
    "...#....#",
    "...######",
  ],
};

export default icon;
