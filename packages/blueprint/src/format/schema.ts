/**
 * The JSON schema of a Blueprint file, version 1, as data. `scripts/blueprint/gen-schema.ts`
 * writes it to `packages/blueprint/schema/blueprint.v1.json` (a test fails when the file is
 * stale), and `validate` (in `read.ts`) checks a file against this same object, so the published
 * schema and the reader never disagree. It mirrors `types.ts` shape for shape.
 */
import { SCHEMA_URL } from "./types";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonSchema = { [key: string]: Json };

const ref = (name: string): JsonSchema => ({ $ref: `#/$defs/${name}` });
const obj = (
  properties: Record<string, JsonSchema>,
  required: string[] = [],
  extra: JsonSchema = {},
): JsonSchema => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
  additionalProperties: false,
  ...extra,
});
const map = (value: JsonSchema, keyPattern = NAME): JsonSchema => ({
  type: "object",
  propertyNames: { pattern: keyPattern },
  additionalProperties: value,
});
const list = (items: JsonSchema, extra: JsonSchema = {}): JsonSchema => ({
  type: "array",
  items,
  ...extra,
});
const num: JsonSchema = { type: "number" };
const str: JsonSchema = { type: "string" };
const bool: JsonSchema = { type: "boolean" };
const oneOf = (...options: JsonSchema[]): JsonSchema => ({ anyOf: options });
const enumOf = (...values: string[]): JsonSchema => ({ enum: values });
const triple = (item: JsonSchema): JsonSchema => ({
  type: "array",
  prefixItems: [item, item, item],
  items: false,
  minItems: 3,
});

/** A local name: no `:` (that is the import prefix separator), no `/` or `.` (paths). */
const NAME = "^[A-Za-z0-9_][A-Za-z0-9_-]*$";
/** A name as used: local, or prefixed by imports (`office:server`, `lib:office:server`). */
const QUALIFIED = "^([A-Za-z0-9_][A-Za-z0-9_-]*:)*[A-Za-z0-9_][A-Za-z0-9_-]*$";
const PARAM_REF = "^@[A-Za-z0-9_][A-Za-z0-9_-]*$";

const primBase: Record<string, JsonSchema> = {
  layer: num,
  decor: bool,
  visible: ref("Flag"),
  tag: str,
};

const prim = (kind: string, properties: Record<string, JsonSchema>, required: string[]) =>
  obj({ kind: { const: kind }, ...primBase, ...properties }, ["kind", ...required]);

const paramChannel: JsonSchema = { type: "string", pattern: "^param:[A-Za-z0-9_][A-Za-z0-9_-]*$" };

export const SCHEMA: JsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: SCHEMA_URL,
  title: "Blueprint file, version 1",
  description:
    "A library of Parts, Assemblies and Scenes for the Blueprint engine. See docs/blueprint/format.md.",
  ...obj(
    {
      $schema: { const: SCHEMA_URL },
      version: { const: 1 },
      id: { type: "string", minLength: 1 },
      imports: list(ref("Import")),
      palette: ref("Palette"),
      parts: map(ref("Part")),
      assemblies: map(ref("Assembly")),
      scenes: map(ref("Scene")),
    },
    ["$schema", "version", "id"],
  ),
  $defs: {
    Vec3: triple(num),
    Turn: { enum: [0, 1, 2, 3] },
    Ink: enumOf("ink", "dim", "faint", "accent", "signal", "alert"),
    ParamRef: { type: "string", pattern: PARAM_REF },
    Num: oneOf(
      num,
      ref("ParamRef"),
      obj({ p: { type: "string", pattern: NAME }, k: num, b: num }, ["p"]),
    ),
    NumVec: triple(ref("Num")),
    Flag: oneOf(bool, ref("ParamRef"), obj({ not: ref("ParamRef") }, ["not"])),
    InkRef: oneOf(
      ref("Ink"),
      obj({ if: ref("Flag"), then: ref("Ink"), else: ref("Ink") }, ["if", "then", "else"]),
    ),
    Import: obj(
      {
        from: { type: "string", minLength: 1 },
        use: list({ type: "string", pattern: QUALIFIED }),
        as: { type: "string", pattern: NAME },
      },
      ["from", "as"],
    ),
    Colour: oneOf(str, obj({ var: str, fallback: str }, ["var", "fallback"])),
    Palette: obj(
      Object.fromEntries(
        ["bg", "ink", "dim", "faint", "accent", "signal", "alert"].map((k) => [k, ref("Colour")]),
      ),
    ),
    Params: map(
      obj({ type: enumOf("number", "flag", "int"), default: oneOf(num, bool) }, [
        "type",
        "default",
      ]),
    ),
    Facing: enumOf("+x", "-x", "+y", "-y", "+z", "-z"),
    Part: obj(
      {
        title: str,
        params: ref("Params"),
        prims: list(ref("Prim")),
        sockets: map(obj({ at: ref("NumVec"), facing: ref("Facing") }, ["at"])),
      },
      ["prims"],
    ),
    BoxLook: enumOf("plain", "accent", "signal", "alert", "ghost"),
    Prim: oneOf(
      prim(
        "box",
        {
          at: ref("NumVec"),
          size: ref("NumVec"),
          anchor: enumOf("corner", "base-centre"),
          tone: triple(ref("Num")),
          look: oneOf(
            ref("BoxLook"),
            obj({ if: ref("Flag"), then: ref("BoxLook"), else: ref("BoxLook") }, [
              "if",
              "then",
              "else",
            ]),
          ),
          plate: bool,
          floors: ref("Num"),
          vents: enumOf("+x", "+y", "-x", "-y"),
        },
        ["at", "size"],
      ),
      prim(
        "line",
        { points: list(ref("NumVec"), { minItems: 2 }), ink: ref("InkRef"), dash: num },
        ["points"],
      ),
      prim("dot", { at: ref("NumVec"), ink: ref("InkRef"), size: num }, ["at"]),
      prim(
        "label",
        {
          at: ref("NumVec"),
          text: str,
          to: ref("NumVec"),
          active: ref("Flag"),
          plain: bool,
          fixed: bool,
          ink: ref("InkRef"),
        },
        ["at", "text"],
      ),
      prim(
        "rig",
        {
          rig: enumOf("wheel", "arm", "fan", "piston", "pendulum", "smoke", "sparks"),
          // Settings that are names ("plane": "yz") are strings that cannot start with "@".
          with: map(
            oneOf(ref("Num"), ref("NumVec"), ref("Flag"), ref("InkRef"), {
              type: "string",
              pattern: "^[^@]",
            }),
          ),
        },
        ["rig", "with"],
      ),
      prim("sprite", { at: ref("NumVec"), sprite: str }, ["at", "sprite"]),
    ),
    Instance: obj(
      {
        id: { type: "string", pattern: NAME },
        use: { type: "string", pattern: QUALIFIED },
        at: ref("NumVec"),
        turn: ref("Turn"),
        scale: { type: "number", exclusiveMinimum: 0 },
        snap: obj({ socket: str, to: { type: "string", pattern: "^[^.]+\\.[^.]+$" } }, [
          "socket",
          "to",
        ]),
        params: map(oneOf(ref("Num"), ref("Flag"))),
        layer: num,
        tag: str,
        visible: ref("Flag"),
      },
      ["use"],
    ),
    Assembly: obj(
      {
        title: str,
        params: ref("Params"),
        instances: list(ref("Instance")),
        sockets: map({ type: "string", pattern: "^[^.]+\\.[^.]+$" }),
      },
      ["instances"],
    ),
    Camera: obj(
      {
        view: ref("Turn"),
        fit: obj({
          fill: { type: "number", exclusiveMinimum: 0, maximum: 1 },
          unit: enumOf("even", "any"),
          box: obj({ min: ref("Vec3"), max: ref("Vec3") }, ["min", "max"]),
          at: obj({ t: num, vars: map(num) }),
        }),
        zooms: list({ type: "number", exclusiveMinimum: 0 }),
        shots: map(obj({ at: ref("Vec3"), zoom: num, view: ref("Turn") }, ["at", "zoom"])),
      },
      ["view", "fit"],
    ),
    Var: oneOf(
      obj({ type: { const: "time" } }, ["type"]),
      obj({ type: { const: "progress" }, default: num }, ["type"]),
      obj(
        {
          type: { const: "int" },
          default: { type: "integer" },
          cycle: obj({ every: num, count: { type: "integer", minimum: 1 } }, ["every", "count"]),
        },
        ["type", "default"],
      ),
      obj({ type: { const: "pointer" } }, ["type"]),
    ),
    Ease: enumOf("linear", "step", "smooth", "glide", "in", "out", "in-out"),
    Track: oneOf(
      obj(
        {
          kind: { const: "key" },
          target: str,
          channel: oneOf(enumOf("at", "turn", "scale"), paramChannel),
          keys: list(
            obj({ t: num, v: oneOf(num, ref("Vec3"), bool), ease: ref("Ease") }, ["t", "v"]),
          ),
        },
        ["kind", "target", "channel", "keys"],
      ),
      obj(
        {
          kind: { const: "visible" },
          target: str,
          keys: list(obj({ t: num, v: bool }, ["t", "v"])),
        },
        ["kind", "target", "keys"],
      ),
      obj({ kind: { const: "spin" }, target: str, channel: paramChannel, rate: num, phase: num }, [
        "kind",
        "target",
        "channel",
        "rate",
      ]),
      obj(
        {
          kind: { const: "path" },
          target: str,
          path: list(ref("Vec3"), { minItems: 2 }),
          duration: num,
          ease: ref("Ease"),
          delay: num,
        },
        ["kind", "target", "path", "duration"],
      ),
      obj(
        {
          kind: { const: "conveyor" },
          use: { type: "string", pattern: QUALIFIED },
          path: list(ref("Vec3"), { minItems: 2 }),
          count: { type: "integer", minimum: 1 },
          speed: num,
          params: map(oneOf(ref("Num"), ref("Flag"))),
        },
        ["kind", "use", "path", "count", "speed"],
      ),
      obj(
        {
          kind: { const: "blink" },
          target: str,
          channel: paramChannel,
          rate: num,
          period: { type: "integer", minimum: 1 },
          on: num,
          seed: num,
          at: num,
        },
        ["kind", "target", "channel", "rate", "period", "on", "seed"],
      ),
      obj(
        {
          kind: { const: "wave" },
          target: str,
          channel: paramChannel,
          wave: enumOf("sin", "cos"),
          rate: num,
          phase: num,
          amp: num,
          base: num,
          clip: bool,
        },
        ["kind", "target", "channel", "wave", "rate", "amp", "base"],
      ),
      obj(
        {
          kind: { const: "spring" },
          target: str,
          channel: paramChannel,
          to: obj({ if: str, then: num, else: num }, ["if", "then", "else"]),
          rate: num,
        },
        ["kind", "target", "channel", "to", "rate"],
      ),
    ),
    Timeline: obj(
      {
        clock: str,
        length: { type: "number", exclusiveMinimum: 0 },
        loop: enumOf("loop", "ping-pong", "once"),
        tracks: list(ref("Track")),
      },
      ["tracks"],
    ),
    Machine: obj(
      {
        initial: str,
        states: map(obj({ play: list(str), shot: str, set: map(num) })),
        transitions: list(
          obj(
            {
              from: str,
              to: str,
              when: oneOf(
                obj(
                  {
                    var: str,
                    range: { type: "array", prefixItems: [num, num], items: false, minItems: 2 },
                  },
                  ["var", "range"],
                ),
                obj({ var: str, equals: num }, ["var", "equals"]),
                obj({ after: num }, ["after"]),
                obj({ event: str }, ["event"]),
              ),
              dissolve: num,
            },
            ["from", "to", "when"],
          ),
        ),
      },
      ["initial", "states", "transitions"],
    ),
    Scene: obj(
      {
        title: str,
        description: str,
        root: ref("Assembly"),
        camera: ref("Camera"),
        depth: enumOf("painter", "zbuffer"),
        palette: ref("Palette"),
        filters: obj({
          pixel: { type: "integer", minimum: 1 },
          dither: { enum: [2, 4, 8, "none"] },
          glow: obj({ radius: num, density: num }, ["radius", "density"]),
        }),
        post: list(str),
        labels: bool,
        vars: map(ref("Var")),
        timelines: map(ref("Timeline")),
        machines: map(ref("Machine")),
      },
      ["title", "root", "camera", "depth"],
    ),
  },
};
