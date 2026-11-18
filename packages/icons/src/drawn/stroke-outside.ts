import type { PixelIcon } from "../types";

// Stroke outside: a solid outer square in the secondary tone around a dashed inner square, the path.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stroke-outside",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooooooo",
    ".o........o",
    ".o.##..##.o",
    ".o.#....#.o",
    ".o........o",
    ".o........o",
    ".o.#....#.o",
    ".o.##..##.o",
    ".o........o",
    ".oooooooooo",
  ],
};

export default icon;
