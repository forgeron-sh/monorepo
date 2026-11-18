import type { PixelIcon } from "../types";

// Bbq grill: a kettle barbecue: two sausages on the grate, the bowl and three legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bbq-grill",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..ooo..ooo",
    "############",
    "#..........#",
    ".#........#",
    "..#......#",
    "...######",
    "...#.##.#",
    "..#..##..#",
    ".#...##...#",
  ],
};

export default icon;
