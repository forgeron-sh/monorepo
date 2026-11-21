import type { PixelIcon } from "../types";

// Branch leaving the main line: square three-pixel nodes, a straight trunk, and the branch
// (secondary tone) joining it with a right-angle elbow instead of the lab's curve.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-branch",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###..ooo",
    "..#.#..o.o",
    "..###..ooo",
    "...#....o",
    "...#....o",
    "...#ooooo",
    "...#",
    "..###",
    "..#.#",
    "..###",
  ],
};

export default icon;
