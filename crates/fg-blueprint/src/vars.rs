//! Vars: the scene's inputs from the host and from itself (docs/blueprint/engine.md §2, `Var`).
//! A var's value, each frame, is the host's when the host set it, else the one a machine's
//! current state sets, else its cycle's (an int var), else its default.

use crate::bin::{SceneBin, Var};
use crate::layout::code;

/// The value of `var` before the machines: the host's, else its cycle's, else its default.
#[inline]
pub fn base_value(var: &Var, host: f64, time: f64) -> f64 {
    if !host.is_nan() {
        return host;
    }
    match var.cycle {
        // `mount`'s cycle: Math.floor(t / every) % count.
        Some((every, count)) if var.ty == code::var_type::INT && every > 0.0 => {
            (time / every).floor() % count
        }
        _ => var.default,
    }
}

/// Fills the root scope from its defaults, the time (slot 0, `t`), the vars and the host's
/// values (NaN where the host set nothing).
pub fn resolve(bin: &SceneBin, defaults: &[f64], host: &[f64], time: f64, scope: &mut Vec<f64>) {
    scope.clear();
    scope.extend_from_slice(defaults);
    if let Some(t) = scope.first_mut() {
        *t = time;
    }
    for v in &bin.vars {
        if let Some(slot) = v.slot {
            if let Some(x) = scope.get_mut(slot) {
                *x = base_value(v, host.get(slot).copied().unwrap_or(f64::NAN), time);
            }
        }
    }
    for (x, &h) in scope.iter_mut().zip(host) {
        if !h.is_nan() {
            *x = h;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn host_then_cycle_then_default() {
        let v = Var {
            name: 0,
            ty: code::var_type::INT,
            slot: Some(1),
            default: -1.0,
            cycle: Some((2.0, 9.0)),
        };
        assert_eq!(base_value(&v, f64::NAN, 0.0), 0.0);
        assert_eq!(base_value(&v, f64::NAN, 5.9), 2.0);
        assert_eq!(base_value(&v, f64::NAN, 19.0), 0.0);
        assert_eq!(base_value(&v, 4.0, 19.0), 4.0);
        let w = Var { cycle: None, ..v };
        assert_eq!(base_value(&w, f64::NAN, 19.0), -1.0);
    }
}
