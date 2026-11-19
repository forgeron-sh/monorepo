//! Tracks: what a timeline drives, evaluated on its clock into channel values (docs/blueprint/
//! engine.md §2, "Timeline"). Eases, key interpolation and paths are written once here; the
//! values land in `Overrides` (instance channels) or in the root scope (the scene's own params).

use crate::bin::{Key, SceneBin, Track};
use crate::layout::code;
use fg_math::num::{cos, hash, hypot, js_max, js_min, js_round, pow, sin, truthy};
use fg_math::Vec3;

/// An ease of `k` ∈ [0, 1] (clamped first).
pub fn ease(kind: i32, k: f64) -> f64 {
    let q = js_min(1.0, js_max(0.0, k));
    match kind {
        code::ease::STEP => {
            if q < 1.0 {
                0.0
            } else {
                1.0
            }
        }
        code::ease::SMOOTH => q * q * (3.0 - 2.0 * q),
        // `glide` of parts.ts: zero velocity at both ends.
        code::ease::GLIDE => q * q * q * (q * (q * 6.0 - 15.0) + 10.0),
        code::ease::IN => q * q,
        code::ease::OUT => q * (2.0 - q),
        code::ease::IN_OUT => {
            if q < 0.5 {
                2.0 * q * q
            } else {
                let r = -2.0 * q + 2.0;
                1.0 - (r * r) / 2.0
            }
        }
        _ => q,
    }
}

/// The value of a key track at `clock`: held before the first key and after the last; between
/// two keys, `a + (b − a)·ease(k)` with the ease of the key the segment ends at.
pub fn key_value(keys: &[Key], clock: f64) -> [f64; 3] {
    let Some(first) = keys.first() else {
        return [0.0; 3];
    };
    if clock <= first.t {
        return first.v;
    }
    for w in keys.windows(2) {
        let (a, b) = (&w[0], &w[1]);
        if clock < b.t {
            let span = b.t - a.t;
            let k = ease(
                b.ease,
                if span > 0.0 {
                    (clock - a.t) / span
                } else {
                    1.0
                },
            );
            return [
                a.v[0] + (b.v[0] - a.v[0]) * k,
                a.v[1] + (b.v[1] - a.v[1]) * k,
                a.v[2] + (b.v[2] - a.v[2]) * k,
            ];
        }
    }
    keys[keys.len() - 1].v
}

/// A boolean key track: the value of the last key at or before `clock` (the first before it).
pub fn key_flag(keys: &[Key], clock: f64) -> bool {
    let mut v = keys.first().is_some_and(|k| truthy(k.v[0]));
    for k in keys {
        if k.t <= clock {
            v = truthy(k.v[0]);
        }
    }
    v
}

#[inline]
fn seg_len(a: Vec3, b: Vec3) -> f64 {
    hypot(&[b[0] - a[0], b[1] - a[1], b[2] - a[2]])
}

/// `pathLength` of parts.ts.
pub fn path_length(pts: &[Vec3]) -> f64 {
    let mut l = 0.0;
    for w in pts.windows(2) {
        l += seg_len(w[0], w[1]);
    }
    l
}

/// `along` of parts.ts: the point at distance `s` along a polyline.
pub fn along(pts: &[Vec3], s: f64) -> Vec3 {
    let mut rest = s;
    for w in pts.windows(2) {
        let d = [w[1][0] - w[0][0], w[1][1] - w[0][1], w[1][2] - w[0][2]];
        let l = hypot(&d);
        if rest <= l {
            let k = rest / if truthy(l) { l } else { 1.0 };
            return [w[0][0] + d[0] * k, w[0][1] + d[1] * k, w[0][2] + d[2] * k];
        }
        rest -= l;
    }
    pts.last().copied().unwrap_or([0.0; 3])
}

/// A copy of a conveyor's part at a point of its path.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Copy {
    pub track: usize,
    pub at: Vec3,
}

/// What the timelines set this frame: instance channels (by instance record) and conveyor
/// copies. The root's params are written into the root scope instead.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Overrides {
    pub at: Vec<Option<Vec3>>,
    pub turn: Vec<Option<u8>>,
    pub scale: Vec<Option<f64>>,
    pub visible: Vec<Option<bool>>,
    /// The param values of instance `i` start at `base[i]`.
    pub params: Vec<Option<f64>>,
    pub base: Vec<usize>,
    pub copies: Vec<Copy>,
}

impl Overrides {
    pub fn for_scene(bin: &SceneBin) -> Self {
        let n = bin.instances.len();
        let mut base = Vec::with_capacity(n);
        let mut total = 0;
        for i in &bin.instances {
            base.push(total);
            total += bin.defs[i.def].params.len();
        }
        Self {
            at: vec![None; n],
            turn: vec![None; n],
            scale: vec![None; n],
            visible: vec![None; n],
            params: vec![None; total],
            base,
            copies: Vec::new(),
        }
    }

    /// Back to no override (keeps the buffers).
    pub fn clear(&mut self) {
        self.at.fill(None);
        self.turn.fill(None);
        self.scale.fill(None);
        self.visible.fill(None);
        self.params.fill(None);
        self.copies.clear();
    }

    /// The overridden value of param `p` of instance `inst`.
    #[inline]
    pub fn param(&self, inst: usize, p: usize) -> Option<f64> {
        self.params.get(self.base.get(inst)? + p).copied().flatten()
    }
}

/// The points of a track's path (its nums are literals, in the root scope).
pub fn path_of(bin: &SceneBin, track: &Track, scope: &[f64], out: &mut Vec<Vec3>) {
    out.clear();
    for &k in &bin.points[track.path.clone()] {
        let v = |i: usize| {
            let n = bin.nums[i];
            let at = |a: f64| scope.get(a as usize).copied().unwrap_or(f64::NAN);
            match n.kind {
                code::num::PARAM => at(n.a),
                code::num::LINEAR => n.b + n.k * at(n.a),
                _ => n.a,
            }
        };
        out.push([v(k), v(k + 1), v(k + 2)]);
    }
}

/// One number a track computes at `clock` (spin, blink, wave), or `None` for the other kinds.
pub fn number(track: &Track, clock: f64) -> Option<f64> {
    match track.kind {
        // value = phase + rate·clock
        code::track::SPIN => Some(match track.phase {
            Some(p) => p + track.rate * clock,
            None => track.rate * clock,
        }),
        // on while at ≤ floor(clock·rate + seed) mod period < at + on
        code::track::BLINK => {
            let m = (clock * track.rate + track.seed).floor() % track.period;
            Some(if m >= track.at && m < track.at + track.on {
                1.0
            } else {
                0.0
            })
        }
        // base + f(clock·rate + phase)·amp
        code::track::WAVE => {
            let x = match track.phase {
                Some(p) => clock * track.rate + p,
                None => clock * track.rate,
            };
            let mut f = if track.wave == code::wave::COS {
                cos(x)
            } else {
                sin(x)
            };
            if track.clip {
                f = js_max(0.0, f);
            }
            Some(track.base + f * track.amp)
        }
        _ => None,
    }
}

/// A `calc` track's value: its operations (`code::op`, a run of the key section), left to right
/// from 0, each one IEEE operation in the order the TypeScript expression it stands for does them
/// (so a value computed by a chain of calcs is the function's, bit for bit). An operand is the
/// literal `v[0]`, or the root scope slot `v[1]` when it is not negative. Comparisons and logic
/// give 1 or 0. `None` when a `when` operand is falsy: the track writes nothing this frame.
pub fn calc(ops: &[Key], scope: &[f64]) -> Option<f64> {
    use code::op::*;
    let mut v = 0.0;
    let b = |c: bool| if c { 1.0 } else { 0.0 };
    for op in ops {
        let x = if op.v[1] >= 0.0 {
            scope.get(op.v[1] as usize).copied().unwrap_or(f64::NAN)
        } else {
            op.v[0]
        };
        v = match op.t as i32 {
            LOAD => x,
            ADD => v + x,
            SUB => v - x,
            RSUB => x - v,
            MUL => v * x,
            DIV => v / x,
            RDIV => x / v,
            MOD => v % x,
            MIN => js_min(v, x),
            MAX => js_max(v, x),
            POW => pow(v, x),
            FLOOR => v.floor(),
            CEIL => v.ceil(),
            ROUND => js_round(v),
            ABS => v.abs(),
            SQRT => v.sqrt(),
            SIN => sin(v),
            COS => cos(v),
            LT => b(v < x),
            LE => b(v <= x),
            GT => b(v > x),
            GE => b(v >= x),
            EQ => b(v == x),
            AND => b(truthy(v) && truthy(x)),
            OR => b(truthy(v) || truthy(x)),
            NOT => b(!truthy(v)),
            HASH => hash(v, x),
            RHASH => hash(x, v),
            EASE => ease(x as i32, v),
            WHEN => {
                if !truthy(x) {
                    return None;
                }
                v
            }
            _ => v,
        };
    }
    Some(v)
}

/// A spring's next value: `now + (to − now)·k`, `k = min(1, dt·rate)` (1 when `dt` is 0, so the
/// first frame lands on the target), as `stack6`'s plates.
#[inline]
pub fn spring(now: f64, to: f64, dt: f64, rate: f64) -> f64 {
    let k = if dt > 0.0 {
        js_min(1.0, dt * rate)
    } else {
        1.0
    };
    now + (to - now) * k
}

#[cfg(test)]
mod tests {
    use super::*;

    fn key(t: f64, v: f64, ease: i32) -> Key {
        Key {
            t,
            v: [v, 0.0, 0.0],
            ease,
        }
    }

    #[test]
    fn eases_against_hand_values() {
        use code::ease::*;
        assert_eq!(ease(LINEAR, 0.25), 0.25);
        assert_eq!(ease(LINEAR, -1.0), 0.0);
        assert_eq!(ease(LINEAR, 2.0), 1.0);
        assert_eq!(ease(STEP, 0.99), 0.0);
        assert_eq!(ease(STEP, 1.0), 1.0);
        assert_eq!(ease(SMOOTH, 0.5), 0.5);
        assert_eq!(ease(SMOOTH, 0.25), 0.15625);
        assert_eq!(ease(GLIDE, 0.5), 0.5);
        assert_eq!(ease(GLIDE, 0.25), 0.103515625);
        assert_eq!(ease(IN, 0.5), 0.25);
        assert_eq!(ease(OUT, 0.5), 0.75);
        assert_eq!(ease(IN_OUT, 0.25), 0.125);
        assert_eq!(ease(IN_OUT, 0.75), 0.875);
        for e in [LINEAR, SMOOTH, GLIDE, IN, OUT, IN_OUT] {
            assert_eq!(ease(e, 0.0), 0.0);
            assert_eq!(ease(e, 1.0), 1.0);
        }
    }

    #[test]
    fn keys_hold_then_interpolate_with_the_next_keys_ease() {
        let keys = [
            key(1.0, 10.0, code::ease::LINEAR),
            key(3.0, 20.0, code::ease::LINEAR),
            key(5.0, 0.0, code::ease::IN),
        ];
        assert_eq!(key_value(&keys, 0.0)[0], 10.0);
        assert_eq!(key_value(&keys, 2.0)[0], 15.0);
        assert_eq!(key_value(&keys, 4.0)[0], 15.0); // 20 + (0 − 20)·0.25
        assert_eq!(key_value(&keys, 9.0)[0], 0.0);
        let flags = [key(0.0, 0.0, 0), key(1.0, 1.0, 0), key(2.0, 0.0, 0)];
        assert!(!key_flag(&flags, 0.5));
        assert!(key_flag(&flags, 1.0));
        assert!(!key_flag(&flags, 2.5));
    }

    fn track(kind: i32) -> Track {
        Track {
            kind,
            target: None,
            channel: code::channel::PARAM,
            param: 0,
            keys: 0..0,
            path: 0..0,
            rate: 0.0,
            phase: None,
            period: 1.0,
            on: 0.0,
            at: 0.0,
            seed: 0.0,
            duration: 1.0,
            delay: 0.0,
            ease: 0,
            def: 0,
            count: 0,
            speed: 0.0,
            wave: 0,
            amp: 0.0,
            base: 0.0,
            clip: false,
            to_slot: 0,
            to_then: 0.0,
            to_else: 0.0,
            args: 0..0,
        }
    }

    #[test]
    fn spin_blink_and_wave() {
        let mut s = track(code::track::SPIN);
        s.rate = 1.4;
        assert_eq!(number(&s, 2.0), Some(2.8));
        s.phase = Some(1.0);
        assert_eq!(number(&s, 2.0), Some(1.0 + 1.4 * 2.0));
        // The rack lights of parts.ts: floor(t·2 + seed·3 + l·5) % 7 < 2.
        let mut b = track(code::track::BLINK);
        (b.rate, b.period, b.on, b.seed) = (2.0, 7.0, 2.0, 8.0);
        for t in [0.0, 0.37, 1.7, 4.3, 9.2, 31.4] {
            let on = (t * 2.0f64 + 8.0).floor() % 7.0 < 2.0;
            assert_eq!(number(&b, t), Some(if on { 1.0 } else { 0.0 }));
        }
        // A window that does not start at 0: usage-iso's beat (floor(t·2) % 4 = row).
        (b.rate, b.period, b.on, b.seed, b.at) = (2.0, 4.0, 1.0, 0.0, 2.0);
        assert_eq!(number(&b, 1.2), Some(1.0));
        assert_eq!(number(&b, 1.6), Some(0.0));
        // web's pop: 0.6 + max(0, sin(t·1.5))·0.8.
        let mut w = track(code::track::WAVE);
        (w.rate, w.amp, w.base, w.clip) = (1.5, 0.8, 0.6, true);
        for t in [0.0f64, 0.37, 1.7, 4.3, 9.2, 31.4] {
            let v = 0.6 + js_max(0.0, sin(t * 1.5)) * 0.8;
            assert_eq!(number(&w, t), Some(v));
        }
    }

    #[test]
    fn spring_with_fixed_dt_is_stack6s_formula() {
        // objects.ts, stack6: k = dt > 0 ? min(1, dt·9) : 1; now += (target − now)·k.
        let (mut now, mut reference) = (0.0f64, 0.0f64);
        let dt = 1.0 / 60.0;
        for frame in 0..240 {
            let target = if (frame / 60) % 2 == 0 { 2.4 } else { 0.0 };
            let d = if frame == 0 { 0.0 } else { dt };
            now = spring(now, target, d, 9.0);
            let k = if d > 0.0 { (d * 9.0f64).min(1.0) } else { 1.0 };
            reference += (target - reference) * k;
            assert_eq!(now.to_bits(), reference.to_bits(), "frame {frame}");
        }
    }

    fn op(code: i32, x: f64) -> Key {
        Key {
            t: code as f64,
            v: [x, -1.0, 0.0],
            ease: 0,
        }
    }

    #[test]
    fn calc_chains_operations_in_order() {
        use code::op::*;
        // village.ts's reveal: clamp((p − a) / (b − a)), at p = 0.72 of the boom step.
        let (a, b) = (0.69f64, 0.8f64);
        let p = 0.72f64;
        let ops = [
            op(LOAD, p),
            op(SUB, a),
            op(DIV, b - a),
            op(MAX, 0.0),
            op(MIN, 1.0),
        ];
        let want = js_min(1.0, js_max(0.0, (p - a) / (b - a)));
        assert_eq!(calc(&ops, &[]), Some(want));
        // A param operand (slot 1), a reversed subtraction, a comparison, a guard.
        let scope = [0.0, 2.5];
        let from_slot = Key {
            t: RSUB as f64,
            v: [f64::NAN, 1.0, 0.0],
            ease: 0,
        };
        assert_eq!(calc(&[op(LOAD, 1.0), from_slot], &scope), Some(1.5));
        assert_eq!(calc(&[op(LOAD, 0.3), op(GT, 0.2)], &[]), Some(1.0));
        assert_eq!(calc(&[op(LOAD, 7.0), op(WHEN, 0.0)], &[]), None);
        assert_eq!(
            calc(&[op(LOAD, 7.6), op(MOD, 3.0), op(FLOOR, 0.0)], &[]),
            Some(1.0)
        );
        assert_eq!(
            calc(&[op(LOAD, 3.0), op(RHASH, 61.0)], &[]),
            Some(hash(61.0, 3.0))
        );
        assert_eq!(
            calc(&[op(LOAD, 0.25), op(EASE, 3.0)], &[]),
            Some(0.103515625)
        );
    }

    #[test]
    fn along_and_length_match_parts_ts() {
        let pts = [[0.0, 0.0, 0.0], [3.0, 4.0, 0.0], [3.0, 4.0, 12.0]];
        assert_eq!(path_length(&pts), 17.0);
        assert_eq!(along(&pts, 2.5), [1.5, 2.0, 0.0]);
        assert_eq!(along(&pts, 11.0), [3.0, 4.0, 6.0]);
        assert_eq!(along(&pts, 99.0), [3.0, 4.0, 12.0]);
    }
}
