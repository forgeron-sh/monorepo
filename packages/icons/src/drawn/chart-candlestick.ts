import type { PixelIcon } from "../types";

// Candlestick chart: a hollow candle and a filled one in the secondary tone, each with wicks.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-candlestick",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "...#",
    "..###",
    "..#.#...o",
    "..#.#...o",
    "..#.#..ooo",
    "..#.#..ooo",
    "..###..ooo",
    "...#...ooo",
    "...#....o",
    "........o",
  ],
};

export default icon;
