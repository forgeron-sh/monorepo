//! The SceneBin reader: the records of `layout.rs` into plain structs. Validation is the
//! TypeScript reader's job; this one only refuses what it cannot index.

use crate::immediate::word;
use crate::layout::{self as L, code};
use std::ops::Range;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Num {
    pub kind: i32,
    pub a: f64,
    pub k: f64,
    pub b: f64,
}

/// A flag: `kind` is a `code::flag` (-1 when the field is absent).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Flag {
    pub kind: i32,
    pub a: f64,
}

/// An ink or a look: a flag choosing between two codes.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Choice {
    pub flag: Flag,
    pub then: i32,
    pub otherwise: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Def {
    pub kind: i32,
    pub name: usize,
    pub params: Range<usize>,
    pub prims: Range<usize>,
    pub instances: Range<usize>,
    pub sockets: Range<usize>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Param {
    pub name: usize,
    pub ty: i32,
    pub default: f64,
}

/// A prim; an index into another section is `None` when absent.
#[derive(Clone, Debug, PartialEq)]
pub struct Prim {
    pub kind: i32,
    pub layer: Option<f64>,
    pub decor: bool,
    pub visible: Option<Flag>,
    pub tag: Option<usize>,
    pub at: Option<usize>,
    pub size: Option<usize>,
    pub anchor: i32,
    pub tone: Option<usize>,
    pub look: Option<Choice>,
    pub plate: bool,
    pub floors: Option<usize>,
    pub vents: i32,
    pub points: Range<usize>,
    pub ink: Option<Choice>,
    pub dash: Option<f64>,
    pub dot_size: Option<f64>,
    pub text: Option<usize>,
    pub to: Option<usize>,
    pub active: Option<Flag>,
    pub plain: bool,
    pub fixed: bool,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Instance {
    pub def: usize,
    pub id: Option<usize>,
    pub at: Option<usize>,
    pub turn: u8,
    pub scale: f64,
    pub snap_socket: Option<usize>,
    pub snap_to: Option<usize>,
    pub snap_to_socket: Option<usize>,
    pub layer: Option<f64>,
    pub tag: Option<usize>,
    pub visible: Option<Flag>,
    pub args: Range<usize>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Arg {
    pub param: usize,
    pub kind: i32,
    pub num: usize,
    pub flag: Flag,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Socket {
    pub name: usize,
    pub kind: i32,
    pub at: Option<usize>,
    pub instance: Option<usize>,
    pub socket: Option<usize>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct SceneRec {
    pub name: usize,
    pub title: usize,
    pub root: usize,
    pub depth: i32,
    pub view: u8,
    pub fill: Option<f64>,
    pub unit: i32,
    pub labels: Option<bool>,
    pub pixel: Option<f64>,
    pub dither: i32,
    pub glow_radius: Option<f64>,
    pub glow_density: Option<f64>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct SceneBin {
    pub strings: Vec<String>,
    pub nums: Vec<Num>,
    pub defs: Vec<Def>,
    pub params: Vec<Param>,
    pub prims: Vec<Prim>,
    pub points: Vec<usize>,
    pub instances: Vec<Instance>,
    pub args: Vec<Arg>,
    pub sockets: Vec<Socket>,
    pub scene: SceneRec,
}

struct Reader<'a> {
    bytes: &'a [u8],
    at: usize,
}

impl Reader<'_> {
    /// The next `n` records of `words` words each, as word slices.
    fn records(&mut self, n: usize, words: usize) -> Result<Vec<Vec<f64>>, String> {
        let end = self.at + n * words;
        if end * 8 > self.bytes.len() {
            return Err("SceneBin truncated".into());
        }
        let out = (0..n)
            .map(|k| {
                (0..words)
                    .map(|f| word(self.bytes, self.at + k * words + f))
                    .collect()
            })
            .collect();
        self.at = end;
        Ok(out)
    }
}

fn opt_index(x: f64) -> Option<usize> {
    if x >= 0.0 {
        Some(x as usize)
    } else {
        None
    }
}

fn opt_num(x: f64) -> Option<f64> {
    if x.is_nan() {
        None
    } else {
        Some(x)
    }
}

fn range(first: f64, count: f64) -> Range<usize> {
    let first = first.max(0.0) as usize;
    first..first + count.max(0.0) as usize
}

fn flag(kind: f64, a: f64) -> Option<Flag> {
    if kind < 0.0 {
        None
    } else {
        Some(Flag {
            kind: kind as i32,
            a,
        })
    }
}

fn choice(kind: f64, a: f64, then: f64, otherwise: f64) -> Option<Choice> {
    flag(kind, a).map(|flag| Choice {
        flag,
        then: then as i32,
        otherwise: otherwise as i32,
    })
}

pub fn read(bytes: &[u8]) -> Result<SceneBin, String> {
    use L::{
        arg, def, header as H, instance as I, num, param, point, prim as P, scene, socket, string,
    };
    if bytes.len() < H::WORDS * 8 || word(bytes, H::MAGIC) as u32 != L::SCENE_MAGIC {
        return Err("not a SceneBin".into());
    }
    let version = word(bytes, H::VERSION) as u32;
    if version != L::SCENE_VERSION {
        return Err(format!(
            "SceneBin version {version}, this engine reads {}",
            L::SCENE_VERSION
        ));
    }
    let count = |f: usize| word(bytes, f).max(0.0) as usize;
    let mut r = Reader {
        bytes,
        at: H::WORDS,
    };
    let strings_raw = r.records(count(H::STRINGS), string::WORDS)?;
    let nums = r.records(count(H::NUMS), num::WORDS)?;
    let defs = r.records(count(H::DEFS), def::WORDS)?;
    let params = r.records(count(H::PARAMS), param::WORDS)?;
    let prims = r.records(count(H::PRIMS), P::WORDS)?;
    let points = r.records(count(H::POINTS), point::WORDS)?;
    let instances = r.records(count(H::INSTANCES), I::WORDS)?;
    let args = r.records(count(H::ARGS), arg::WORDS)?;
    let sockets = r.records(count(H::SOCKETS), socket::WORDS)?;
    let scene_raw = r.records(1, scene::WORDS)?.remove(0);
    let text_start = r.at * 8;
    let text_len = count(H::BYTES);
    let text = bytes
        .get(text_start..text_start + text_len)
        .ok_or("SceneBin strings truncated")?;
    let mut strings = Vec::with_capacity(strings_raw.len());
    for s in &strings_raw {
        let (o, n) = (s[string::OFFSET] as usize, s[string::LENGTH] as usize);
        let raw = text.get(o..o + n).ok_or("string out of range")?;
        strings.push(
            std::str::from_utf8(raw)
                .map_err(|_| "string is not UTF-8")?
                .to_owned(),
        );
    }
    let out = SceneBin {
        strings,
        nums: nums
            .iter()
            .map(|n| Num {
                kind: n[num::KIND] as i32,
                a: n[num::A],
                k: n[num::K],
                b: n[num::B],
            })
            .collect(),
        defs: defs
            .iter()
            .map(|d| Def {
                kind: d[def::KIND] as i32,
                name: d[def::NAME] as usize,
                params: range(d[def::PARAMS], d[def::PARAM_COUNT]),
                prims: range(d[def::PRIMS], d[def::PRIM_COUNT]),
                instances: range(d[def::INSTANCES], d[def::INSTANCE_COUNT]),
                sockets: range(d[def::SOCKETS], d[def::SOCKET_COUNT]),
            })
            .collect(),
        params: params
            .iter()
            .map(|p| Param {
                name: p[param::NAME] as usize,
                ty: p[param::TYPE] as i32,
                default: p[param::DEFAULT],
            })
            .collect(),
        prims: prims
            .iter()
            .map(|p| Prim {
                kind: p[P::KIND] as i32,
                layer: opt_num(p[P::LAYER]),
                decor: p[P::DECOR] != 0.0,
                visible: flag(p[P::VISIBLE_KIND], p[P::VISIBLE_A]),
                tag: opt_index(p[P::TAG]),
                at: opt_index(p[P::AT]),
                size: opt_index(p[P::SIZE]),
                anchor: p[P::ANCHOR] as i32,
                tone: opt_index(p[P::TONE]),
                look: choice(
                    p[P::LOOK_KIND],
                    p[P::LOOK_A],
                    p[P::LOOK_THEN],
                    p[P::LOOK_ELSE],
                ),
                plate: p[P::PLATE] != 0.0,
                floors: opt_index(p[P::FLOORS]),
                vents: p[P::VENTS] as i32,
                points: range(p[P::POINTS], p[P::POINT_COUNT]),
                ink: choice(p[P::INK_KIND], p[P::INK_A], p[P::INK_THEN], p[P::INK_ELSE]),
                dash: opt_num(p[P::DASH]),
                dot_size: opt_num(p[P::DOT_SIZE]),
                text: opt_index(p[P::TEXT]),
                to: opt_index(p[P::TO]),
                active: flag(p[P::ACTIVE_KIND], p[P::ACTIVE_A]),
                plain: p[P::PLAIN] != 0.0,
                fixed: p[P::FIXED] != 0.0,
            })
            .collect(),
        points: points.iter().map(|p| p[point::AT] as usize).collect(),
        instances: instances
            .iter()
            .map(|i| Instance {
                def: i[I::DEF] as usize,
                id: opt_index(i[I::ID]),
                at: opt_index(i[I::AT]),
                turn: (i[I::TURN] as i64).rem_euclid(4) as u8,
                scale: i[I::SCALE],
                snap_socket: opt_index(i[I::SNAP_SOCKET]),
                snap_to: opt_index(i[I::SNAP_TO]),
                snap_to_socket: opt_index(i[I::SNAP_TO_SOCKET]),
                layer: opt_num(i[I::LAYER]),
                tag: opt_index(i[I::TAG]),
                visible: flag(i[I::VISIBLE_KIND], i[I::VISIBLE_A]),
                args: range(i[I::ARGS], i[I::ARG_COUNT]),
            })
            .collect(),
        args: args
            .iter()
            .map(|a| Arg {
                param: a[arg::PARAM] as usize,
                kind: a[arg::KIND] as i32,
                num: a[arg::NUM].max(0.0) as usize,
                flag: Flag {
                    kind: a[arg::FLAG_KIND] as i32,
                    a: a[arg::FLAG_A],
                },
            })
            .collect(),
        sockets: sockets
            .iter()
            .map(|s| Socket {
                name: s[socket::NAME] as usize,
                kind: s[socket::KIND] as i32,
                at: opt_index(s[socket::AT]),
                instance: opt_index(s[socket::INSTANCE]),
                socket: opt_index(s[socket::SOCKET]),
            })
            .collect(),
        scene: SceneRec {
            name: scene_raw[scene::NAME] as usize,
            title: scene_raw[scene::TITLE] as usize,
            root: scene_raw[scene::ROOT] as usize,
            depth: scene_raw[scene::DEPTH] as i32,
            view: (scene_raw[scene::VIEW] as i64).rem_euclid(4) as u8,
            fill: opt_num(scene_raw[scene::FILL]),
            unit: scene_raw[scene::UNIT] as i32,
            labels: if scene_raw[scene::LABELS] < 0.0 {
                None
            } else {
                Some(scene_raw[scene::LABELS] != 0.0)
            },
            pixel: opt_num(scene_raw[scene::PIXEL]),
            dither: scene_raw[scene::DITHER] as i32,
            glow_radius: opt_num(scene_raw[scene::GLOW_RADIUS]),
            glow_density: opt_num(scene_raw[scene::GLOW_DENSITY]),
        },
    };
    out.check()?;
    Ok(out)
}

impl SceneBin {
    /// Every index points inside its section.
    fn check(&self) -> Result<(), String> {
        let s = self.strings.len();
        let n = self.nums.len();
        let ok_str = |i: Option<usize>| i.is_none_or(|i| i < s);
        let ok_vec = |i: Option<usize>| i.is_none_or(|i| i + 3 <= n);
        let in_range = |r: &Range<usize>, len: usize| r.end <= len;
        if self.scene.root >= self.defs.len() || self.scene.name >= s || self.scene.title >= s {
            return Err("scene record out of range".into());
        }
        for d in &self.defs {
            if d.name >= s
                || !in_range(&d.params, self.params.len())
                || !in_range(&d.prims, self.prims.len())
                || !in_range(&d.instances, self.instances.len())
                || !in_range(&d.sockets, self.sockets.len())
            {
                return Err("definition out of range".into());
            }
        }
        for p in &self.prims {
            let ok = ok_str(p.tag)
                && ok_str(p.text)
                && ok_vec(p.at)
                && ok_vec(p.size)
                && ok_vec(p.tone)
                && ok_vec(p.to)
                && p.floors.is_none_or(|i| i < n)
                && in_range(&p.points, self.points.len());
            if !ok {
                return Err("prim out of range".into());
            }
        }
        if self.points.iter().any(|&p| p + 3 > n) {
            return Err("point out of range".into());
        }
        for i in &self.instances {
            if i.def >= self.defs.len()
                || !ok_vec(i.at)
                || !ok_str(i.id)
                || !ok_str(i.tag)
                || !ok_str(i.snap_socket)
                || !ok_str(i.snap_to_socket)
                || !in_range(&i.args, self.args.len())
            {
                return Err("instance out of range".into());
            }
        }
        if self
            .args
            .iter()
            .any(|a| a.kind == code::arg::NUM && a.num >= n)
        {
            return Err("argument out of range".into());
        }
        for k in &self.sockets {
            if k.name >= s || !ok_vec(k.at) || !ok_str(k.socket) {
                return Err("socket out of range".into());
            }
        }
        Ok(())
    }
}

// ── The tree, as text ──────────────────────────────────────────────────────────
// Compared by the contract test with `describeScene` of packages/blueprint/src/format/scenebin.ts.

/// A number as the description writes it: an integer below 1e15 in decimal, else its bits in hex.
pub fn describe_number(x: f64) -> String {
    if x.is_nan() {
        "nan".into()
    } else if x.fract() == 0.0 && x.abs() < 1e15 {
        format!("{}", x as i64)
    } else {
        format!("0x{:016x}", x.to_bits())
    }
}

/// `JSON.stringify` of a string.
pub fn json_string(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{8}' => out.push_str("\\b"),
            '\u{c}' => out.push_str("\\f"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

impl SceneBin {
    fn q(&self, s: usize) -> String {
        json_string(&self.strings[s])
    }

    fn scope_names(&self, def: &Def) -> Vec<String> {
        self.params[def.params.clone()]
            .iter()
            .map(|p| self.strings[p.name].clone())
            .collect()
    }

    fn fmt_num(&self, i: usize, names: &[String]) -> String {
        let n = self.nums[i];
        let name = |a: f64| json_string(names.get(a as usize).map_or("?", |s| s.as_str()));
        match n.kind {
            code::num::PARAM => format!("@{}", name(n.a)),
            code::num::LINEAR => {
                format!(
                    "({}+{}*@{})",
                    describe_number(n.b),
                    describe_number(n.k),
                    name(n.a)
                )
            }
            _ => describe_number(n.a),
        }
    }

    fn fmt_vec(&self, i: usize, names: &[String]) -> String {
        format!(
            "[{},{},{}]",
            self.fmt_num(i, names),
            self.fmt_num(i + 1, names),
            self.fmt_num(i + 2, names)
        )
    }

    fn fmt_flag(&self, f: &Flag, names: &[String]) -> String {
        let name = |a: f64| json_string(names.get(a as usize).map_or("?", |s| s.as_str()));
        match f.kind {
            code::flag::PARAM => format!("@{}", name(f.a)),
            code::flag::NOT => format!("!@{}", name(f.a)),
            _ => (f.a != 0.0).to_string(),
        }
    }

    fn fmt_choice(&self, c: &Choice, names: &[String]) -> String {
        format!(
            "{}?{}:{}",
            self.fmt_flag(&c.flag, names),
            c.then,
            c.otherwise
        )
    }

    fn describe_prim(&self, p: &Prim, names: &[String]) -> String {
        let kind = match p.kind {
            code::prim::BOX => "box",
            code::prim::LINE => "line",
            code::prim::DOT => "dot",
            code::prim::LABEL => "label",
            code::prim::RIG => "rig",
            _ => "sprite",
        };
        let mut out = vec![format!("prim {kind}")];
        if let Some(l) = p.layer {
            out.push(format!("layer={}", describe_number(l)));
        }
        if p.decor {
            out.push("decor".into());
        }
        if let Some(v) = &p.visible {
            out.push(format!("visible={}", self.fmt_flag(v, names)));
        }
        if let Some(t) = p.tag {
            out.push(format!("tag={}", self.q(t)));
        }
        let vec = |i: Option<usize>| i.map(|i| self.fmt_vec(i, names)).unwrap_or_default();
        let ink = |out: &mut Vec<String>| {
            if let Some(c) = &p.ink {
                out.push(format!("ink={}", self.fmt_choice(c, names)));
            }
        };
        match p.kind {
            code::prim::BOX => {
                out.push(format!("at={}", vec(p.at)));
                out.push(format!("size={}", vec(p.size)));
                if p.anchor == code::anchor::BASE_CENTRE {
                    out.push("anchor=base-centre".into());
                }
                if p.tone.is_some() {
                    out.push(format!("tone={}", vec(p.tone)));
                }
                if let Some(c) = &p.look {
                    out.push(format!("look={}", self.fmt_choice(c, names)));
                }
                if p.plate {
                    out.push("plate".into());
                }
                if let Some(f) = p.floors {
                    out.push(format!("floors={}", self.fmt_num(f, names)));
                }
                if p.vents >= 0 {
                    out.push(format!("vents={}", p.vents));
                }
            }
            code::prim::LINE => {
                let pts: Vec<String> = self.points[p.points.clone()]
                    .iter()
                    .map(|&k| self.fmt_vec(k, names))
                    .collect();
                out.push(format!("points=[{}]", pts.join(",")));
                ink(&mut out);
                if let Some(d) = p.dash {
                    out.push(format!("dash={}", describe_number(d)));
                }
            }
            code::prim::DOT => {
                out.push(format!("at={}", vec(p.at)));
                ink(&mut out);
                if let Some(s) = p.dot_size {
                    out.push(format!("size={}", describe_number(s)));
                }
            }
            code::prim::LABEL => {
                out.push(format!("at={}", vec(p.at)));
                out.push(format!(
                    "text={}",
                    p.text.map(|t| self.q(t)).unwrap_or_default()
                ));
                if p.to.is_some() {
                    out.push(format!("to={}", vec(p.to)));
                }
                if let Some(a) = &p.active {
                    out.push(format!("active={}", self.fmt_flag(a, names)));
                }
                if p.plain {
                    out.push("plain".into());
                }
                if p.fixed {
                    out.push("fixed".into());
                }
                ink(&mut out);
            }
            code::prim::SPRITE => out.push(format!("at={}", vec(p.at))),
            _ => {}
        }
        out.join(" ")
    }

    fn describe_instance(&self, i: &Instance, names: &[String]) -> String {
        let used = &self.defs[i.def];
        let mut out = vec![format!("instance use={}", self.q(used.name))];
        if let Some(id) = i.id {
            out.push(format!("id={}", self.q(id)));
        }
        if let Some(at) = i.at {
            out.push(format!("at={}", self.fmt_vec(at, names)));
        }
        out.push(format!("turn={}", i.turn));
        out.push(format!("scale={}", describe_number(i.scale)));
        if let (Some(s), Some(to)) = (i.snap_socket, i.snap_to) {
            let target = i.snap_to_socket.map(|t| self.q(t)).unwrap_or_default();
            out.push(format!("snap={}>{}.{}", self.q(s), to, target));
        }
        if let Some(l) = i.layer {
            out.push(format!("layer={}", describe_number(l)));
        }
        if let Some(t) = i.tag {
            out.push(format!("tag={}", self.q(t)));
        }
        if let Some(v) = &i.visible {
            out.push(format!("visible={}", self.fmt_flag(v, names)));
        }
        let params = &self.params[used.params.clone()];
        let args: Vec<String> = self.args[i.args.clone()]
            .iter()
            .map(|a| {
                let name = params
                    .get(a.param)
                    .map(|p| self.q(p.name))
                    .unwrap_or_default();
                let value = if a.kind == code::arg::FLAG {
                    self.fmt_flag(&a.flag, names)
                } else {
                    self.fmt_num(a.num, names)
                };
                format!("{name}:{value}")
            })
            .collect();
        out.push(format!("args=[{}]", args.join(",")));
        out.join(" ")
    }

    /// The tree this SceneBin carries, as text.
    pub fn describe(&self) -> String {
        let s = &self.scene;
        let opt = |x: Option<f64>| x.map_or("-".to_string(), describe_number);
        let mut lines = vec![format!(
            "scene {} title={} depth={} view={} fill={} unit={} labels={} pixel={} dither={} glow={}/{}",
            self.q(s.name),
            self.q(s.title),
            if s.depth == code::depth::ZBUFFER { "zbuffer" } else { "painter" },
            s.view,
            opt(s.fill),
            if s.unit == code::unit::ANY { "any" } else { "even" },
            match s.labels {
                None => "-",
                Some(true) => "on",
                Some(false) => "off",
            },
            opt(s.pixel),
            match s.dither {
                -1 => "-".to_string(),
                0 => "none".to_string(),
                n => n.to_string(),
            },
            opt(s.glow_radius),
            opt(s.glow_density),
        )];
        for d in &self.defs {
            let names = self.scope_names(d);
            let kind = if d.kind == code::def::PART {
                "part"
            } else {
                "assembly"
            };
            lines.push(format!("def {} {kind}", self.q(d.name)));
            for p in &self.params[d.params.clone()] {
                let ty = match p.ty {
                    code::param_type::FLAG => "flag",
                    code::param_type::INT => "int",
                    _ => "number",
                };
                lines.push(format!(
                    "  param {} {ty} {}",
                    self.q(p.name),
                    describe_number(p.default)
                ));
            }
            for p in &self.prims[d.prims.clone()] {
                lines.push(format!("  {}", self.describe_prim(p, &names)));
            }
            if d.kind == code::def::PART {
                for k in &self.sockets[d.sockets.clone()] {
                    let at = k.at.map(|a| self.fmt_vec(a, &names)).unwrap_or_default();
                    lines.push(format!("  socket {} at={at}", self.q(k.name)));
                }
            } else {
                for i in &self.instances[d.instances.clone()] {
                    lines.push(format!("  {}", self.describe_instance(i, &names)));
                }
                for k in &self.sockets[d.sockets.clone()] {
                    let socket = k.socket.map(|t| self.q(t)).unwrap_or_default();
                    lines.push(format!(
                        "  socket {} path={}.{socket}",
                        self.q(k.name),
                        k.instance.map_or(-1, |i| i as i64)
                    ));
                }
            }
        }
        let mut out = lines.join("\n");
        out.push('\n');
        out
    }
}
