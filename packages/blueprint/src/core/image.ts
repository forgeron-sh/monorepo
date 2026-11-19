/**
 * Dithered images live in `@forgeron/shaders` (D-149): the `image` source and the `image-dither`
 * pass (`ditheredImagePreset`). The browser glue is `mountImage` in `/dom`.
 */
export { ditherImage, IMAGE_PALETTE, type ImagePalette } from "@forgeron/shaders";
