import type { PixelIcon } from "../types";

// The AWS Lambda mark in pixels: a bold lowercase lambda.
// 12×12: `#` primary tone. Rasterised from `simple-icons:awslambda` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// AWS Lambda and the AWS Lambda logo are trademarks of Amazon.com, Inc., used here only to refer to AWS Lambda.
const icon: PixelIcon = {
  name: "aws-lambda",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    "...##",
    "...###",
    "....##",
    "....###",
    "...####",
    "...##.##",
    "..##..##",
    "..##...##",
    ".##....####",
  ],
};

export default icon;
