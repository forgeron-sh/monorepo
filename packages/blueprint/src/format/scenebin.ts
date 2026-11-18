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
  RigPrim,
  Scene,
  Track,
  Vec3,
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
  // Parts a conveyor rides are definitions of the scene too, after what the root uses.
  for (const timeline of Object.values(scene.timelines ?? {}))
    for (const track of timeline.tracks)
      if (track.kind === "conveyor" && !seen.has(track.use)) {
        seen.add(track.use);
        visit({ instances: [{ use: track.use }] });
      }
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
      writeRig(w, prim, s, f);
      break;
  }
  w.push("prim", f);
}

const RIG_CODE = CODES.rig;

/** A rig's settings (`with`), in the rigArg section: nums, vectors, flags, ink choices, names. */
function writeRig(w: Writer, prim: RigPrim, s: Scope, f: Record<string, number>): void {
  f.rig = RIG_CODE[prim.rig];
  const args = Object.entries(prim.with).map(([name, v]) => {
    const rec: Record<string, number> = { name: w.str(name) };
    if (typeof v === "number" || (typeof v === "string" && v.startsWith("@"))) {
      rec.kind = CODES.rigArg.num;
      rec.num = s.num(v as Num);
    } else if (typeof v === "string") {
      rec.kind = CODES.rigArg.name;
      rec.text = w.str(v);
    } else if (typeof v === "boolean" || "not" in v) {
      rec.kind = CODES.rigArg.flag;
      [rec.flagKind, rec.flagA] = s.flag(v as Flag);
    } else if (Array.isArray(v)) {
      rec.kind = CODES.rigArg.vec;
      rec.num = s.vec(v as NumVec);
    } else if ("if" in v) {
      rec.kind = CODES.rigArg.ink;
      [rec.flagKind, rec.flagA, rec.then, rec.else] = s.choice(v as InkRef, INK_CODE);
    } else {
      rec.kind = CODES.rigArg.num;
      rec.num = s.num(v as Num);
    }
    return rec;
  });
  f.rigArgs = w.section("rigArg").length;
  f.rigArgCount = args.length;
  for (const a of args) w.push("rigArg", a);
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

/** What a host needs besides the bytes: names of the root scope, machines and strings. */
export interface EncodedScene {
  bytes: Uint8Array;
  /** The string table: tags, events and state names are indices into it. */
  strings: readonly string[];
  /** The root scope, in slot order: `t`, the vars, then the root's params. */
  scope: readonly string[];
  /** Each var: its slot in the root scope (-1 for `time` and `pointer`) and its spec. */
  vars: readonly { name: string; slot: number; type: string }[];
  /** Each machine and its state names, in the order of the outputs block. */
  machines: readonly { name: string; states: readonly string[] }[];
}

/** One scene of `lib` as SceneBin bytes. */
export function writeSceneBin(
  lib: Library,
  sceneName: string,
  options: SceneBinOptions = {},
): Uint8Array {
  return encodeScene(lib, sceneName, options).bytes;
}

/** Instance path ("line/package") → the index of that instance's record. */
function resolveTarget(
  target: string,
  entries: DefEntry[],
  instanceStart: Map<string, number>,
  where: string,
): number {
  if (target === "") return -1;
  let entry = entries[0]!;
  let index = -1;
  for (const id of target.split("/")) {
    const instances = entry.assembly?.instances ?? [];
    const k = instances.findIndex((o) => o.id === id);
    if (k < 0) throw new BlueprintError(`${where}: no instance "${id}" in "${target}"`);
    index = instanceStart.get(entry.name)! + k;
    const next = entries.find((e) => e.name === instances[k]!.use);
    if (!next) throw new BlueprintError(`${where}: "${instances[k]!.use}" is not defined`);
    entry = next;
  }
  return index;
}

const EASE_CODE = {
  linear: CODES.ease.linear,
  step: CODES.ease.step,
  smooth: CODES.ease.smooth,
  glide: CODES.ease.glide,
  in: CODES.ease.in,
  out: CODES.ease.out,
  "in-out": CODES.ease.inOut,
} as const;

/** The timelines, vars and machines of a scene, after its definitions. */
function writeAnimation(
  w: Writer,
  scene: Scene,
  entries: DefEntry[],
  defs: Map<string, number>,
  instanceStart: Map<string, number>,
): void {
  const scope = entries[0]!.params.map(([n]) => n);
  const root = new Scope(w, scope, "/scene");
  const slot = (name: string, where: string) => {
    const i = scope.lastIndexOf(name);
    if (i < 0) throw new BlueprintError(`${where}: no var or root param "${name}"`);
    return i;
  };
  for (const [name, v] of Object.entries(scene.vars ?? {}))
    w.push("var", {
      name: w.str(name),
      type: CODES.varType[v.type],
      slot: v.type === "time" ? 0 : v.type === "pointer" ? -1 : slot(name, `/vars/${name}`),
      default: v.type === "int" ? v.default : v.type === "progress" ? (v.default ?? 0) : 0,
      every: v.type === "int" && v.cycle ? v.cycle.every : Number.NaN,
      count: v.type === "int" && v.cycle ? v.cycle.count : Number.NaN,
    });
  const timelineNames = Object.keys(scene.timelines ?? {});
  for (const [name, tl] of Object.entries(scene.timelines ?? {})) {
    const where = `/timelines/${name}`;
    const clock = tl.clock === undefined || tl.clock === "t" ? -1 : slot(tl.clock, where);
    const first = w.section("track").length;
    tl.tracks.forEach((track, i) => writeTrack(w, track, `${where}/tracks/${i}`));
    w.push("timeline", {
      name: w.str(name),
      clock: clock < 0 ? CODES.clock.time : CODES.clock.var,
      clockSlot: clock,
      length: tl.length ?? Number.NaN,
      loop:
        tl.length === undefined
          ? CODES.loopMode.none
          : tl.loop === "ping-pong"
            ? CODES.loopMode.pingPong
            : tl.loop === "once"
              ? CODES.loopMode.once
              : CODES.loopMode.loop,
      tracks: first,
      trackCount: tl.tracks.length,
    });
  }
  function writeTrack(w: Writer, track: Track, where: string): void {
    const f: Record<string, number> = { kind: CODES.track[track.kind] };
    let specs: [string, ParamSpec][] = entries[0]!.params;
    if ("target" in track) {
      f.target = resolveTarget(track.target, entries, instanceStart, where);
      if (f.target >= 0) {
        const at = (target: string) => {
          // The used definition of the last instance on the path.
          let entry = entries[0]!;
          for (const id of target.split("/")) {
            const inst = entry.assembly!.instances.find((o) => o.id === id)!;
            entry = entries.find((e) => e.name === inst.use)!;
          }
          return entry;
        };
        specs = at(track.target).params;
      }
    }
    const channel = (c: string) => {
      if (c.startsWith("param:")) {
        const name = c.slice(6);
        const i = specs.findIndex(([n]) => n === name);
        if (i < 0) throw new BlueprintError(`${where}: no parameter "${name}"`);
        f.channel = CODES.channel.param;
        f.param = i;
      } else f.channel = CODES.channel[c as "at" | "turn" | "scale"];
    };
    const keys = (list: readonly { t: number; v: number | Vec3 | boolean; ease?: string }[]) => {
      f.keys = w.section("key").length;
      f.keyCount = list.length;
      for (const k of list) {
        const v =
          typeof k.v === "boolean"
            ? [Number(k.v), 0, 0]
            : typeof k.v === "number"
              ? [k.v, 0, 0]
              : k.v;
        w.push("key", {
          t: k.t,
          v0: v[0]!,
          v1: v[1]!,
          v2: v[2]!,
          ease: EASE_CODE[(k.ease ?? "linear") as keyof typeof EASE_CODE],
        });
      }
    };
    const path = (pts: readonly Vec3[]) => {
      const first = w.section("point").length;
      const nums = pts.map((p) => root.vec(p));
      for (const at of nums) w.push("point", { at });
      f.path = first;
      f.pathCount = pts.length;
    };
    switch (track.kind) {
      case "key":
        channel(track.channel);
        keys(track.keys);
        break;
      case "visible":
        f.channel = CODES.channel.visible;
        keys(track.keys);
        break;
      case "spin":
        channel(track.channel);
        f.rate = track.rate;
        f.phase = track.phase ?? Number.NaN;
        break;
      case "path":
        f.channel = CODES.channel.at;
        path(track.path);
        f.duration = track.duration;
        f.delay = track.delay ?? 0;
        f.ease = EASE_CODE[track.ease ?? "linear"];
        break;
      case "conveyor": {
        path(track.path);
        const def = defs.get(track.use);
        if (def === undefined) throw new BlueprintError(`${where}: "${track.use}" is not defined`);
        f.use = def;
        f.count = track.count;
        f.speed = track.speed;
        const used = entries[def]!.params;
        const args = Object.entries(track.params ?? {}).map(([name, value]) => {
          const param = used.findIndex(([n]) => n === name);
          if (param < 0) throw new BlueprintError(`${where}: "${track.use}" has no "${name}"`);
          if (used[param]![1].type === "flag") {
            const [flagKind, flagA] = root.flag(value as Flag);
            return { param, kind: CODES.arg.flag, num: -1, flagKind, flagA };
          }
          return {
            param,
            kind: CODES.arg.num,
            num: root.num(value as Num),
            flagKind: -1,
            flagA: 0,
          };
        });
        f.args = w.section("arg").length;
        f.argCount = args.length;
        for (const a of args) w.push("arg", a);
        break;
      }
      case "blink":
        channel(track.channel);
        f.rate = track.rate;
        f.period = track.period;
        f.on = track.on;
        f.seed = track.seed;
        f.at = track.at ?? 0;
        break;
      case "spring":
        channel(track.channel);
        f.toSlot = slot(track.to.if, where);
        f.toThen = track.to.then;
        f.toElse = track.to.else;
        f.rate = track.rate;
        break;
      case "wave":
        channel(track.channel);
        f.wave = CODES.wave[track.wave];
        f.rate = track.rate;
        f.phase = track.phase ?? Number.NaN;
        f.amp = track.amp;
        f.base = track.base;
        f.clip = track.clip ? 1 : 0;
        break;
    }
    w.push("track", f);
  }
  for (const [name, m] of Object.entries(scene.machines ?? {})) {
    const where = `/machines/${name}`;
    const states = Object.keys(m.states);
    const stateIndex = (s: string) => {
      const i = states.indexOf(s);
      if (i < 0) throw new BlueprintError(`${where}: no state "${s}"`);
      return i;
    };
    const firstState = w.section("state").length;
    for (const [sname, st] of Object.entries(m.states)) {
      const plays = (st.play ?? []).map((tl) => {
        const i = timelineNames.indexOf(tl);
        if (i < 0) throw new BlueprintError(`${where}/states/${sname}: no timeline "${tl}"`);
        return i;
      });
      const sets = Object.entries(st.set ?? {}).map(([v, value]) => ({
        slot: slot(v, `${where}/states/${sname}`),
        value,
      }));
      const p0 = w.section("play").length;
      for (const timeline of plays) w.push("play", { timeline });
      const s0 = w.section("set").length;
      for (const x of sets) w.push("set", x);
      w.push("state", {
        name: w.str(sname),
        plays: p0,
        playCount: plays.length,
        sets: s0,
        setCount: sets.length,
        shot: st.shot === undefined ? -1 : w.str(st.shot),
      });
    }
    const firstTransition = w.section("transition").length;
    m.transitions.forEach((tr) => {
      const rec: Record<string, number> = {
        from: tr.from === "*" ? -1 : stateIndex(tr.from),
        to: stateIndex(tr.to),
        dissolve: tr.dissolve ?? 0,
      };
      const when = tr.when;
      if ("range" in when) {
        rec.when = CODES.when.range;
        rec.slot = slot(when.var, where);
        [rec.lo, rec.hi] = when.range;
      } else if ("equals" in when) {
        rec.when = CODES.when.equals;
        rec.slot = slot(when.var, where);
        rec.value = when.equals;
      } else if ("after" in when) {
        rec.when = CODES.when.after;
        rec.after = when.after;
      } else {
        rec.when = CODES.when.event;
        rec.event = w.str(when.event);
      }
      w.push("transition", rec);
    });
    w.push("machine", {
      name: w.str(name),
      initial: stateIndex(m.initial),
      states: firstState,
      stateCount: states.length,
      transitions: firstTransition,
      transitionCount: m.transitions.length,
    });
  }
}

/** One scene of `lib` as SceneBin bytes, with the names a host needs to drive it. */
export function encodeScene(
  lib: Library,
  sceneName: string,
  options: SceneBinOptions = {},
): EncodedScene {
  const scene = lib.scenes.get(sceneName);
  if (!scene) throw new BlueprintError(`no scene "${sceneName}" in ${lib.file.id}`);
  const entries = sceneDefs(lib, sceneName);
  const defs = new Map(entries.map((e, i) => [e.name, i]));
  const instanceStart = new Map<string, number>();
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
      instanceStart.set(e.name, w.section("instance").length);
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
  writeAnimation(w, scene, entries, defs, instanceStart);
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
    "rigArg",
    "var",
    "timeline",
    "track",
    "key",
    "machine",
    "state",
    "play",
    "set",
    "transition",
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
  return {
    bytes: out,
    strings: w.strings,
    scope: entries[0]!.params.map(([n]) => n),
    vars: Object.entries(scene.vars ?? {}).map(([name, v]) => ({
      name,
      type: v.type,
      slot:
        v.type === "time"
          ? 0
          : v.type === "pointer"
            ? -1
            : entries[0]!.params.findIndex(([n]) => n === name),
    })),
    machines: Object.entries(scene.machines ?? {}).map(([name, m]) => ({
      name,
      states: Object.keys(m.states),
    })),
  };
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
      out.push(`rig=${RIG_CODE[p.rig]}`, `with=${Object.keys(p.with).length}`);
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
  const tracks = Object.values(scene.timelines ?? {}).reduce((n, tl) => n + tl.tracks.length, 0);
  lines.push(
    [
      `vars=${Object.keys(scene.vars ?? {}).length}`,
      `timelines=${Object.keys(scene.timelines ?? {}).length}`,
      `tracks=${tracks}`,
      `machines=${Object.keys(scene.machines ?? {}).length}`,
    ].join(" "),
  );
  return `${lines.join("\n")}\n`;
}
