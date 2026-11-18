//! The animation of a loaded scene, one step per frame (§3 "The frame", steps 1–2): vars, then
//! machines, then every playing timeline's tracks on its clock. A timeline that no state plays
//! always plays, on the time (or on its var clock); one a state plays runs on the time since that
//! state was entered. Values land in the root scope and in `Overrides`.

use crate::bin::SceneBin;
use crate::layout::code;
use crate::machine::{Events, Machines};
use crate::tracks::{
    along, ease, key_flag, key_value, number, path_length, path_of, spring, Copy, Overrides,
};
use crate::vars;
use fg_math::num::{js_min, truthy};
use fg_math::Vec3;

#[derive(Clone, Debug)]
pub struct Animator {
    pub machines: Machines,
    /// Each spring track's value (NaN until its first frame).
    pub springs: Vec<f64>,
    /// The host's values of the root scope (NaN: not set).
    pub host: Vec<f64>,
    pub over: Overrides,
    /// Timelines some state plays.
    owned: Vec<bool>,
    path: Vec<Vec3>,
}

/// A timeline's local clock folded by its length and loop.
pub fn fold(clock: f64, length: Option<f64>, looping: i32) -> f64 {
    let Some(len) = length else { return clock };
    match looping {
        code::loop_mode::LOOP => clock % len,
        code::loop_mode::PING_PONG => {
            let m = clock % (2.0 * len);
            if m > len {
                2.0 * len - m
            } else {
                m
            }
        }
        code::loop_mode::ONCE => js_min(clock, len),
        _ => clock,
    }
}

impl Animator {
    pub fn new(bin: &SceneBin, scope_len: usize) -> Self {
        let mut owned = vec![false; bin.timelines.len()];
        for &p in &bin.plays {
            owned[p] = true;
        }
        Self {
            machines: Machines::new(bin),
            springs: vec![f64::NAN; bin.tracks.len()],
            host: vec![f64::NAN; scope_len],
            over: Overrides::for_scene(bin),
            owned,
            path: Vec::new(),
        }
    }

    /// Back to the start: initial states, springs unset (the host's values stay).
    pub fn reset(&mut self, bin: &SceneBin) {
        self.machines = Machines::new(bin);
        self.springs.fill(f64::NAN);
    }

    /// One frame at `time` (`dt` since the last): fills `scope` and `self.over`. True when a
    /// machine changed state.
    pub fn step(
        &mut self,
        bin: &SceneBin,
        defaults: &[f64],
        scope: &mut Vec<f64>,
        time: f64,
        dt: f64,
        events: &Events,
    ) -> bool {
        vars::resolve(bin, defaults, &self.host, time, scope);
        let changed = self.machines.step(bin, scope, time, events);
        self.machines.apply_sets(bin, &self.host, scope);
        self.over.clear();
        for (i, tl) in bin.timelines.iter().enumerate() {
            let start = if self.owned[i] {
                match self.machines.playing(bin, i) {
                    Some(entered) => entered,
                    None => continue,
                }
            } else {
                0.0
            };
            let raw = match tl.clock {
                Some(slot) => scope.get(slot).copied().unwrap_or(0.0),
                None if self.owned[i] => time - start,
                None => time,
            };
            let clock = fold(raw, tl.length, tl.looping);
            for k in tl.tracks.clone() {
                self.track(bin, k, clock, dt, scope);
            }
        }
        changed
    }

    fn write(&mut self, bin: &SceneBin, k: usize, v: f64, scope: &mut [f64]) {
        let t = &bin.tracks[k];
        match (t.target, t.channel) {
            (None, code::channel::PARAM) => {
                if let Some(x) = scope.get_mut(t.param) {
                    *x = v;
                }
            }
            (Some(i), code::channel::PARAM) => {
                let at = self.over.base[i] + t.param;
                self.over.params[at] = Some(v);
            }
            (Some(i), code::channel::SCALE) => self.over.scale[i] = Some(v),
            (Some(i), code::channel::TURN) => {
                self.over.turn[i] = Some((v as i64).rem_euclid(4) as u8)
            }
            (Some(i), code::channel::VISIBLE) => self.over.visible[i] = Some(truthy(v)),
            _ => {}
        }
    }

    fn track(&mut self, bin: &SceneBin, k: usize, clock: f64, dt: f64, scope: &mut [f64]) {
        let t = &bin.tracks[k];
        match t.kind {
            code::track::KEY => {
                let keys = &bin.keys[t.keys.clone()];
                let v = key_value(keys, clock);
                match (t.channel, t.target) {
                    (code::channel::AT, Some(i)) => self.over.at[i] = Some(v),
                    _ => self.write(bin, k, v[0], scope),
                }
            }
            code::track::VISIBLE => {
                if let Some(i) = t.target {
                    self.over.visible[i] = Some(key_flag(&bin.keys[t.keys.clone()], clock));
                }
            }
            code::track::PATH => {
                path_of(bin, t, scope, &mut self.path);
                let s = ease(t.ease, (clock - t.delay) / t.duration) * path_length(&self.path);
                if let Some(i) = t.target {
                    self.over.at[i] = Some(along(&self.path, s));
                }
            }
            code::track::CONVEYOR => {
                path_of(bin, t, scope, &mut self.path);
                let l = path_length(&self.path);
                let n = t.count as f64;
                for c in 0..t.count {
                    let s = (clock * t.speed + (c as f64 * l) / n) % l;
                    self.over.copies.push(Copy {
                        track: k,
                        at: along(&self.path, s),
                    });
                }
            }
            code::track::SPRING => {
                let to = if truthy(scope.get(t.to_slot).copied().unwrap_or(0.0)) {
                    t.to_then
                } else {
                    t.to_else
                };
                let now = self.springs[k];
                let v = if now.is_nan() {
                    to
                } else {
                    spring(now, to, dt, t.rate)
                };
                self.springs[k] = v;
                self.write(bin, k, v, scope);
            }
            _ => {
                if let Some(v) = number(t, clock) {
                    self.write(bin, k, v, scope);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn loops_fold_the_clock() {
        assert_eq!(fold(7.5, Some(2.0), code::loop_mode::LOOP), 1.5);
        assert_eq!(fold(3.0, Some(2.0), code::loop_mode::PING_PONG), 1.0);
        assert_eq!(fold(1.5, Some(2.0), code::loop_mode::PING_PONG), 1.5);
        assert_eq!(fold(9.0, Some(2.0), code::loop_mode::ONCE), 2.0);
        assert_eq!(fold(9.0, None, code::loop_mode::NONE), 9.0);
    }
}
