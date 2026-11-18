/**
 * SceneBin: one scene of a resolved library as the compact binary the Rust core reads (layout in
 * `engine/layout.ts`). JSON is parsed and validated here, in TypeScript; Rust gets flat records
 * of float64 words with every number exact, names in a string table, and parameter references
 * already turned into indices of their scope.
 */
import { BlueprintError } from "../core/blocks";
import {
  CODES,
  offsets,
  RECORDS,
  type RecordName,
  SCENE_MAGIC,
  SCENE_VERSION,
} from "../engine/layout";
import type { Library } from "./read";
import type {
  Assembly,
  BoxLook,
  Flag,
  Ink,
  InkRef,
  Instance,
  Num,
  NumVec,
  ParamSpec,
  Part,
  Prim,
  Scene,
} from "./types";

type Rec = number[];

/** A definition as SceneBin orders them: the scene's root first, then what it uses, depth first. */
interface DefEntry {
  name: string;
  kind: "part" | "assembly";
  /** Param names and specs in scope order (the root: `t`, the vars, then its own params). */
  params: [string, ParamSpec][];
  part?: Part;
  assembly?: Assembly;
}

const ROOT = (scene: string) => `scene:${scene}`;

/** The scope of a scene's root: `t`, its int and progress vars, then the root's params (as `flatten`). */
function rootParams(scene: Scene): [string, ParamSpec][] {
  const scope = new Map<string, ParamSpec>([["t", { type: "number", default: 0 }]]);
  for (const [name, v] of Object.entries(scene.vars ?? {}))
    if (v.type === "int") scope.set(name, { type: "int", default: v.default });
    else if (v.type === "progress") scope.set(name, { type: "number", default: v.default ?? 0 });
  for (const [name, spec] of Object.entries(scene.root.params ?? {})) scope.set(name, spec);
  return [...scope];
}

/** The definitions a scene reaches, root first, in first-use order. */
export function sceneDefs(lib: Library, sceneName: string): DefEntry[] {
  const scene = lib.scenes.get(sceneName);
  if (!scene) throw new BlueprintError(`no scene "${sceneName}" in ${lib.file.id}`);
  const out: DefEntry[] = [
    { name: ROOT(sceneName), kind: "assembly", params: rootParams(scene), assembly: scene.root },
  ];
  const seen = new Set<string>();
  const visit = (a: Assembly) => {
    for (const inst of a.instances) {
      if (seen.has(inst.use)) continue;
      seen.add(inst.use);
      const part = lib.parts.get(inst.use);
      const assembly = lib.assemblies.get(inst.use);
      if (part)
        out.push({ name: inst.use, kind: "part", params: Object.entries(part.params ?? {}), part });
      else if (assembly) {
        out.push({
          name: inst.use,
          kind: "assembly",
          params: Object.entries(assembly.params ?? {}),
          assembly,
        });
        visit(assembly);
      } else throw new BlueprintError(`"${inst.use}" is not defined`);
    }
  };
  visit(scene.root);
  return out;
}

const INK_CODE: Record<Ink, number> = CODES.ink;
const LOOK_CODE: Record<BoxLook, number> = CODES.look;
const VENTS_CODE = { "+x": 0, "+y": 1, "-x": 2, "-y": 3 } as const;

class Writer {
  readonly sections = new Map<RecordName, Rec[]>();
  readonly strings: string[] = [];
  private readonly stringIndex = new Map<string, number>();

  section(name: RecordName): Rec[] {
    let s = this.sections.get(name);
    if (!s) this.sections.set(name, (s = []));
    return s;
  }

  push(name: RecordName, fields: Record<string, number>): number {
    const o = offsets(name) as Record<string, number>;
    const rec: Rec = new Array(RECORDS[name].length).fill(-1);
    for (const [k, v] of Object.entries(fields)) {
      const i = o[k];
      if (i === undefined) throw new Error(`no field ${k} in ${name}`);
      rec[i] = v;
    }
    const s = this.section(name);
    s.push(rec);
    return s.length - 1;
  }

  str(s: string): number {
    let i = this.stringIndex.get(s);
    if (i === undefined) {
      i = this.strings.length;
      this.strings.push(s);
      this.stringIndex.set(s, i);
    }
    return i;
  }
}

/** Encodes numbers, flags and choices against the param names of one scope. */
class Scope {
  constructor(
    private readonly w: Writer,
    private readonly names: readonly string[],
    private readonly where: string,
  ) {}

  index(ref: string): number {
    const i = this.names.lastIndexOf(ref.slice(1));
    if (i < 0) throw new BlueprintError(`${this.where}: unknown parameter "${ref}"`);
    return i;
  }

  num(n: Num): number {
    if (typeof n === "number")
      return this.w.push("num", { kind: CODES.num.literal, a: n, k: 1, b: 0 });
    if (typeof n === "string")
      return this.w.push("num", { kind: CODES.num.param, a: this.index(n), k: 1, b: 0 });
    return this.w.push("num", {
      kind: CODES.num.linear,
      a: this.index(`@${n.p}`),
      k: n.k ?? 1,
      b: n.b ?? 0,
    });
  }

  vec(v: NumVec): number {
    const first = this.num(v[0]);
    this.num(v[1]);
    this.num(v[2]);
    return first;
  }

  flag(f: Flag): [number, number] {
    if (typeof f === "boolean") return [CODES.flag.value, f ? 1 : 0];
    if (typeof f === "string") return [CODES.flag.param, this.index(f)];
    return [CODES.flag.not, this.index(f.not)];
  }

  choice<T extends string>(
    c: T | { if: Flag; then: T; else: T },
    codes: Record<T, number>,
  ): [number, number, number, number] {
    if (typeof c === "string") return [CODES.flag.value, 1, codes[c], codes[c]];
    const [kind, a] = this.flag(c.if);
    return [kind, a, codes[c.then], codes[c.else]];
  }
}

function writePrim(w: Writer, prim: Prim, s: Scope): void {
  const f: Record<string, number> = {
    kind: CODES.prim[prim.kind],
    layer: prim.layer ?? Number.NaN,
    decor: prim.decor ? 1 : 0,
    anchor: CODES.anchor.corner,
    plate: 0,
    vents: CODES.vents.none,
    points: 0,
    pointCount: 0,
    dash: Number.NaN,
    dotSize: Number.NaN,
    plain: 0,
    fixed: 0,
  };
  if (prim.visible !== undefined) [f.visibleKind, f.visibleA] = s.flag(prim.visible);
  if (prim.tag !== undefined) f.tag = w.str(prim.tag);
  const ink = (i: InkRef | undefined) => {
    if (i !== undefined) [f.inkKind, f.inkA, f.inkThen, f.inkElse] = s.choice(i, INK_CODE);
  };
  switch (prim.kind) {
    case "box":
      f.at = s.vec(prim.at);
      f.size = s.vec(prim.size);
      if (prim.anchor === "base-centre") f.anchor = CODES.anchor.baseCentre;
      if (prim.tone) f.tone = s.vec(prim.tone);
      if (prim.look !== undefined)
        [f.lookKind, f.lookA, f.lookThen, f.lookElse] = s.choice(prim.look, LOOK_CODE);
      f.plate = prim.plate ? 1 : 0;
      if (prim.floors !== undefined) f.floors = s.num(prim.floors);
      if (prim.vents !== undefined) f.vents = VENTS_CODE[prim.vents];
      break;
    case "line": {
      const points = prim.points.map((p) => s.vec(p));
      f.points = w.section("point").length;
      f.pointCount = points.length;
      for (const at of points) w.push("point", { at });
      ink(prim.ink);
      if (prim.dash !== undefined) f.dash = prim.dash;
      break;
    }
    case "dot":
      f.at = s.vec(prim.at);
      ink(prim.ink);
      if (prim.size !== undefined) f.dotSize = prim.size;
      break;
    case "label":
      f.at = s.vec(prim.at);
      f.text = w.str(prim.text);
      if (prim.to) f.to = s.vec(prim.to);
      if (prim.active !== undefined) [f.activeKind, f.activeA] = s.flag(prim.active);
      f.plain = prim.plain ? 1 : 0;
      f.fixed = prim.fixed ? 1 : 0;
      ink(prim.ink);
      break;
    case "sprite":
      f.at = s.vec(prim.at);
      break;
    case "rig":
      break;
  }
  w.push("prim", f);
}

function writeInstance(
  w: Writer,
  inst: Instance,
  siblings: readonly Instance[],
  s: Scope,
  defs: Map<string, number>,
  entries: DefEntry[],
  where: string,
): void {
  const def = defs.get(inst.use);
  if (def === undefined) throw new BlueprintError(`${where}: "${inst.use}" is not defined`);
  const f: Record<string, number> = {
    def,
    turn: inst.turn ?? 0,
    scale: inst.scale ?? 1,
    layer: inst.layer ?? Number.NaN,
  };
  if (inst.id !== undefined) f.id = w.str(inst.id);
  if (inst.at) f.at = s.vec(inst.at);
  if (inst.snap) {
    const [id, socket] = inst.snap.to.split(".") as [string, string];
    const to = siblings.findIndex((o) => o.id === id);
    if (to < 0) throw new BlueprintError(`${where}/snap/to: no instance "${id}"`);
    f.snapSocket = w.str(inst.snap.socket);
    f.snapTo = to;
    f.snapToSocket = w.str(socket);
  }
  if (inst.tag !== undefined) f.tag = w.str(inst.tag);
  if (inst.visible !== undefined) [f.visibleKind, f.visibleA] = s.flag(inst.visible);
  const specs = entries[def]!.params;
  const args = Object.entries(inst.params ?? {}).map(([name, value]) => {
    const param = specs.findIndex(([n]) => n === name);
    if (param < 0) throw new BlueprintError(`${where}: "${inst.use}" has no parameter "${name}"`);
    if (specs[param]![1].type === "flag") {
      const [flagKind, flagA] = s.flag(value as Flag);
      return { param, kind: CODES.arg.flag, num: -1, flagKind, flagA };
    }
    return { param, kind: CODES.arg.num, num: s.num(value as Num), flagKind: -1, flagA: 0 };
  });
  f.args = w.section("arg").length;
  f.argCount = args.length;
  for (const a of args) w.push("arg", a);
  w.push("instance", f);
}

/** Overrides of the scene's camera fit and labels, as a page mounts it (`data-fill`, `data-unit`). */
export interface SceneBinOptions {
  fill?: number;
  unit?: "even" | "any";
  labels?: boolean;
}

/** One scene of `lib` as SceneBin bytes. */
export function writeSceneBin(
  lib: Library,
  sceneName: string,
  options: SceneBinOptions = {},
): Uint8Array {
  const scene = lib.scenes.get(sceneName);
  if (!scene) throw new BlueprintError(`no scene "${sceneName}" in ${lib.file.id}`);
  const entries = sceneDefs(lib, sceneName);
  const defs = new Map(entries.map((e, i) => [e.name, i]));
  const w = new Writer();
  entries.forEach((e) => {
    const names = e.params.map(([n]) => n);
    const where = e.kind === "part" ? `/parts/${e.name}` : `/assemblies/${e.name}`;
    const s = new Scope(w, names, where);
    const rec: Record<string, number> = {
      kind: e.kind === "part" ? CODES.def.part : CODES.def.assembly,
      name: w.str(e.name),
      params: w.section("param").length,
      paramCount: e.params.length,
      prims: w.section("prim").length,
      primCount: 0,
      instances: w.section("instance").length,
      instanceCount: 0,
      sockets: w.section("socket").length,
      socketCount: 0,
    };
    for (const [name, spec] of e.params)
      w.push("param", {
        name: w.str(name),
        type: CODES.paramType[spec.type],
        default: typeof spec.default === "boolean" ? Number(spec.default) : spec.default,
      });
    if (e.part) {
      for (const prim of e.part.prims) writePrim(w, prim, s);
      rec.primCount = e.part.prims.length;
      const sockets = Object.entries(e.part.sockets ?? {});
      for (const [name, socket] of sockets)
        w.push("socket", { name: w.str(name), kind: CODES.socket.point, at: s.vec(socket.at) });
      rec.socketCount = sockets.length;
    } else if (e.assembly) {
      const instances = e.assembly.instances;
      instances.forEach((inst, i) =>
        writeInstance(w, inst, instances, s, defs, entries, `${where}/instances/${i}`),
      );
      rec.instanceCount = instances.length;
      const sockets = Object.entries(e.assembly.sockets ?? {});
      for (const [name, path] of sockets) {
        const [id, socket] = path.split(".") as [string, string];
        const instance = instances.findIndex((o) => o.id === id);
        if (instance < 0) throw new BlueprintError(`${where}/sockets/${name}: no instance "${id}"`);
        w.push("socket", {
          name: w.str(name),
          kind: CODES.socket.path,
          instance,
          socket: w.str(socket),
        });
      }
      rec.socketCount = sockets.length;
    }
    w.push("def", rec);
  });
  // The def records were pushed after their contents: their order is still the entries' order.
  const unit = options.unit ?? scene.camera.fit.unit;
  const labels = options.labels ?? scene.labels;
  const dither = scene.filters?.dither;
  const sceneRec: Record<string, number> = {
    name: w.str(sceneName),
    title: w.str(scene.title),
    root: 0,
    depth: CODES.depth[scene.depth],
    view: scene.camera.view,
    fill: options.fill ?? scene.camera.fit.fill ?? Number.NaN,
    unit: unit === "any" ? CODES.unit.any : CODES.unit.even,
    labels: labels === undefined ? -1 : Number(labels),
    pixel: scene.filters?.pixel ?? Number.NaN,
    dither: dither === undefined ? -1 : dither === "none" ? 0 : dither,
    glowRadius: scene.filters?.glow?.radius ?? Number.NaN,
    glowDensity: scene.filters?.glow?.density ?? Number.NaN,
  };
  const text = new TextEncoder();
  const bytes: Uint8Array[] = [];
  let byteLength = 0;
  for (const s of w.strings) {
    const b = text.encode(s);
    w.push("string", { offset: byteLength, length: b.length });
    bytes.push(b);
    byteLength += b.length;
  }
  const order: RecordName[] = [
    "string",
    "num",
    "def",
    "param",
    "prim",
    "point",
    "instance",
    "arg",
    "socket",
  ];
  const header: Rec = [
    SCENE_MAGIC,
    SCENE_VERSION,
    ...order.map((n) => w.section(n).length),
    byteLength,
  ];
  const scene1 = new Array(RECORDS.scene.length).fill(-1) as Rec;
  const so = offsets("scene") as Record<string, number>;
  for (const [k, v] of Object.entries(sceneRec)) scene1[so[k]!] = v;
  const words = [header, ...order.flatMap((n) => w.section(n)), scene1].flat();
  const out = new Uint8Array(words.length * 8 + byteLength);
  const view = new DataView(out.buffer);
  words.forEach((x, i) => view.setFloat64(i * 8, x, true));
  let at = words.length * 8;
  for (const b of bytes) {
    out.set(b, at);
    at += b.length;
  }
  return out;
}

// ── The tree, as text ──────────────────────────────────────────────────────────
// The contract test compares this description, made from the library, with the one the Rust
// core makes from the SceneBin it read (`describe` in crates/fg-blueprint/src/bin.rs).

/** A number as the description writes it: an integer below 1e15 in decimal, else its bits in hex. */
export function describeNumber(x: number): string {
  if (Number.isNaN(x)) return "nan";
  if (Number.isInteger(x) && Math.abs(x) < 1e15) return String(x === 0 ? 0 : x);
  const v = new DataView(new ArrayBuffer(8));
  v.setFloat64(0, x);
  return `0x${v.getBigUint64(0).toString(16).padStart(16, "0")}`;
}

const q = (s: string) => JSON.stringify(s);
const fmt = describeNumber;
const fmtNum = (n: Num) =>
  typeof n === "number"
    ? fmt(n)
    : typeof n === "string"
      ? `@${q(n.slice(1))}`
      : `(${fmt(n.b ?? 0)}+${fmt(n.k ?? 1)}*@${q(n.p)})`;
const fmtVec = (v: NumVec) => `[${v.map(fmtNum).join(",")}]`;
const fmtFlag = (f: Flag) =>
  typeof f === "boolean"
    ? String(f)
    : typeof f === "string"
      ? `@${q(f.slice(1))}`
      : `!@${q(f.not.slice(1))}`;
function fmtChoice<T extends string>(
  c: T | { if: Flag; then: T; else: T },
  codes: Record<T, number>,
) {
  return typeof c === "string"
    ? `true?${codes[c]}:${codes[c]}`
    : `${fmtFlag(c.if)}?${codes[c.then]}:${codes[c.else]}`;
}

function describePrim(p: Prim): string {
  const out = [`prim ${p.kind}`];
  if (p.layer !== undefined) out.push(`layer=${fmt(p.layer)}`);
  if (p.decor) out.push("decor");
  if (p.visible !== undefined) out.push(`visible=${fmtFlag(p.visible)}`);
  if (p.tag !== undefined) out.push(`tag=${q(p.tag)}`);
  switch (p.kind) {
    case "box":
      out.push(`at=${fmtVec(p.at)}`, `size=${fmtVec(p.size)}`);
      if (p.anchor === "base-centre") out.push("anchor=base-centre");
      if (p.tone) out.push(`tone=${fmtVec(p.tone)}`);
      if (p.look !== undefined) out.push(`look=${fmtChoice(p.look, LOOK_CODE)}`);
      if (p.plate) out.push("plate");
      if (p.floors !== undefined) out.push(`floors=${fmtNum(p.floors)}`);
      if (p.vents !== undefined) out.push(`vents=${VENTS_CODE[p.vents]}`);
      break;
    case "line":
      out.push(`points=[${p.points.map(fmtVec).join(",")}]`);
      if (p.ink !== undefined) out.push(`ink=${fmtChoice(p.ink, INK_CODE)}`);
      if (p.dash !== undefined) out.push(`dash=${fmt(p.dash)}`);
      break;
    case "dot":
      out.push(`at=${fmtVec(p.at)}`);
      if (p.ink !== undefined) out.push(`ink=${fmtChoice(p.ink, INK_CODE)}`);
      if (p.size !== undefined) out.push(`size=${fmt(p.size)}`);
      break;
    case "label":
      out.push(`at=${fmtVec(p.at)}`, `text=${q(p.text)}`);
      if (p.to) out.push(`to=${fmtVec(p.to)}`);
      if (p.active !== undefined) out.push(`active=${fmtFlag(p.active)}`);
      if (p.plain) out.push("plain");
      if (p.fixed) out.push("fixed");
      if (p.ink !== undefined) out.push(`ink=${fmtChoice(p.ink, INK_CODE)}`);
      break;
    case "sprite":
      out.push(`at=${fmtVec(p.at)}`);
      break;
    case "rig":
      break;
  }
  return out.join(" ");
}

function describeInstance(
  inst: Instance,
  siblings: readonly Instance[],
  specs: [string, ParamSpec][],
) {
  const out = [`instance use=${q(inst.use)}`];
  if (inst.id !== undefined) out.push(`id=${q(inst.id)}`);
  if (inst.at) out.push(`at=${fmtVec(inst.at)}`);
  out.push(`turn=${inst.turn ?? 0}`, `scale=${fmt(inst.scale ?? 1)}`);
  if (inst.snap) {
    const [id, socket] = inst.snap.to.split(".") as [string, string];
    out.push(`snap=${q(inst.snap.socket)}>${siblings.findIndex((o) => o.id === id)}.${q(socket)}`);
  }
  if (inst.layer !== undefined) out.push(`layer=${fmt(inst.layer)}`);
  if (inst.tag !== undefined) out.push(`tag=${q(inst.tag)}`);
  if (inst.visible !== undefined) out.push(`visible=${fmtFlag(inst.visible)}`);
  const args = Object.entries(inst.params ?? {}).map(([name, v]) => {
    const flag = specs.find(([n]) => n === name)?.[1].type === "flag";
    return `${q(name)}:${flag ? fmtFlag(v as Flag) : fmtNum(v as Num)}`;
  });
  out.push(`args=[${args.join(",")}]`);
  return out.join(" ");
}

/** The tree a SceneBin of `scene` carries, as text: defs, params, prims, instances, sockets. */
export function describeScene(
  lib: Library,
  sceneName: string,
  options: SceneBinOptions = {},
): string {
  const scene = lib.scenes.get(sceneName);
  if (!scene) throw new BlueprintError(`no scene "${sceneName}" in ${lib.file.id}`);
  const entries = sceneDefs(lib, sceneName);
  const fill = options.fill ?? scene.camera.fit.fill;
  const unit = options.unit ?? scene.camera.fit.unit ?? "even";
  const labels = options.labels ?? scene.labels;
  const d = scene.filters?.dither;
  const glow = scene.filters?.glow;
  const lines = [
    [
      `scene ${q(sceneName)}`,
      `title=${q(scene.title)}`,
      `depth=${scene.depth}`,
      `view=${scene.camera.view}`,
      `fill=${fill === undefined ? "-" : fmt(fill)}`,
      `unit=${unit}`,
      `labels=${labels === undefined ? "-" : labels ? "on" : "off"}`,
      `pixel=${scene.filters?.pixel === undefined ? "-" : fmt(scene.filters.pixel)}`,
      `dither=${d === undefined ? "-" : d}`,
      `glow=${glow ? `${fmt(glow.radius)}/${fmt(glow.density)}` : "-/-"}`,
    ].join(" "),
  ];
  for (const e of entries) {
    lines.push(`def ${q(e.name)} ${e.kind}`);
    for (const [name, spec] of e.params)
      lines.push(`  param ${q(name)} ${spec.type} ${fmt(Number(spec.default))}`);
    if (e.part) {
      for (const p of e.part.prims) lines.push(`  ${describePrim(p)}`);
      for (const [name, s] of Object.entries(e.part.sockets ?? {}))
        lines.push(`  socket ${q(name)} at=${fmtVec(s.at)}`);
    }
    if (e.assembly) {
      const instances = e.assembly.instances;
      for (const inst of instances) {
        const used = entries.find((o) => o.name === inst.use);
        lines.push(`  ${describeInstance(inst, instances, used?.params ?? [])}`);
      }
      for (const [name, path] of Object.entries(e.assembly.sockets ?? {})) {
        const [id, socket] = path.split(".") as [string, string];
        lines.push(
          `  socket ${q(name)} path=${instances.findIndex((o) => o.id === id)}.${q(socket)}`,
        );
      }
    }
  }
  return `${lines.join("\n")}\n`;
}
