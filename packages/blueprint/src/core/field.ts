/**
 * Generator fields: full-surface backgrounds computed per pixel cell (ember, globe, dissolve,
 * field), quantised to two colours (three with the accent) by an 8×8 ordered dither. They live in
 * `@forgeron/shaders` (D-149): the `field` source with the `ordered`, `grid` and `palette` passes
 * (`fieldPreset`), whose GLSL is the shader the site ran. See docs/migration.md, "Generators".
 */
export { FIELD_FRAGMENT, FIELD_MODES, FIELD_VERTEX, type FieldMode } from "@forgeron/shaders";
