import type { PixelIcon } from "../types";

// A toy locomotive: chimney, boiler, cab and three wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "toy-train",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##...####",
    "..##...#..#",
    ".#######..#",
    ".#........#",
    ".##########",
    ".oo..oo..oo",
    ".oo..oo..oo",
  ],
};

export default icon;
