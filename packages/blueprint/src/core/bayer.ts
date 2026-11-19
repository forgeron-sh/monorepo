/**
 * The ordered-dither matrix lives in `@forgeron/shaders` (D-149): one table for every effect.
 * Blueprint's Rust raster carries the same matrix (`crates/fg-blueprint`).
 */
export { bayer, type BayerSize, matrix } from "@forgeron/shaders";
