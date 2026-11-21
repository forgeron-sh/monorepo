//! `Math.sin` and `Math.cos` as Node computes them on the parity machine (V8 13.6 on arm64): V8's
//! port of fdlibm (`src/base/ieee754.cc`: the original kernels, `__kernel_cos` with its `qx`
//! correction, and `__ieee754_rem_pio2` with its `npio2_hw` table), **compiled by clang with
//! floating-point contraction**: every `a·b ± c` inside one expression is a fused multiply-add.
//! The `libm` crate follows musl (newer kernels, another reduction, no contraction) and differs
//! from V8 on about 1.6 % of arguments; this port equals V8 on a million random arguments in
//! ±200 (P3 notes). Beyond 2^19·π/2 (`__kernel_rem_pio2`, never reached by the site's scenes) it
//! reduces in three Cody–Waite steps instead (deterministic, less precise than V8 there).

// The constants keep fdlibm's own decimal spelling, so they can be checked against it.
#![allow(clippy::excessive_precision, clippy::approx_constant)]

#[inline]
fn high(x: f64) -> i32 {
    (x.to_bits() >> 32) as i32
}

#[inline]
fn from_words(hi: u32, lo: u32) -> f64 {
    f64::from_bits(((hi as u64) << 32) | lo as u64)
}

fn kernel_sin(x: f64, y: f64, iy: i32) -> f64 {
    const HALF: f64 = 5.00000000000000000000e-01;
    const S1: f64 = -1.66666666666666324348e-01;
    const S2: f64 = 8.33333333332248946124e-03;
    const S3: f64 = -1.98412698298579493134e-04;
    const S4: f64 = 2.75573137070700676789e-06;
    const S5: f64 = -2.50507602534068634195e-08;
    const S6: f64 = 1.58969099521155010221e-10;
    let ix = high(x) & 0x7fffffff;
    if ix < 0x3e400000 && x as i32 == 0 {
        return x;
    }
    let z = x * x;
    let v = z * x;
    let r = z.mul_add(z.mul_add(z.mul_add(z.mul_add(S6, S5), S4), S3), S2);
    if iy == 0 {
        v.mul_add(z.mul_add(r, S1), x)
    } else {
        x - (-v).mul_add(S1, z.mul_add(HALF.mul_add(y, -(v * r)), -y))
    }
}

fn kernel_cos(x: f64, y: f64) -> f64 {
    const ONE: f64 = 1.0;
    const C1: f64 = 4.16666666666666019037e-02;
    const C2: f64 = -1.38888888888741095749e-03;
    const C3: f64 = 2.48015872894767294178e-05;
    const C4: f64 = -2.75573143513906633035e-07;
    const C5: f64 = 2.08757232129817482790e-09;
    const C6: f64 = -1.13596475577881948265e-11;
    let ix = high(x) & 0x7fffffff;
    if ix < 0x3e400000 && x as i32 == 0 {
        return ONE;
    }
    let z = x * x;
    let r = z * z.mul_add(
        z.mul_add(z.mul_add(z.mul_add(z.mul_add(C6, C5), C4), C3), C2),
        C1,
    );
    if ix < 0x3fd33333 {
        ONE - 0.5f64.mul_add(z, -z.mul_add(r, -(x * y)))
    } else {
        let qx = if ix > 0x3fe90000 {
            0.28125
        } else {
            from_words((ix - 0x00200000) as u32, 0)
        };
        let iz = 0.5f64.mul_add(z, -qx);
        let a = ONE - qx;
        a - (iz - z.mul_add(r, -(x * y)))
    }
}

const NPIO2_HW: [i32; 32] = [
    0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB, 0x402921FB,
    0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C, 0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB,
    0x403AB41B, 0x403C463A, 0x403DD85A, 0x403F6A7A, 0x40407E4C, 0x4041475C, 0x4042106C, 0x4042D97C,
    0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB, 0x404858EB, 0x404921FB,
];

/// `__ieee754_rem_pio2` up to 2^19·π/2; `None` beyond (the caller falls back).
fn rem_pio2(x: f64) -> Option<(i32, f64, f64)> {
    const HALF: f64 = 0.5;
    const INVPIO2: f64 = 6.36619772367581382433e-01;
    const PIO2_1: f64 = 1.57079632673412561417e+00;
    const PIO2_1T: f64 = 6.07710050650619224932e-11;
    const PIO2_2: f64 = 6.07710050630396597660e-11;
    const PIO2_2T: f64 = 2.02226624879595063154e-21;
    const PIO2_3: f64 = 2.02226624871116645580e-21;
    const PIO2_3T: f64 = 8.47842766036889956997e-32;
    let hx = high(x);
    let ix = hx & 0x7fffffff;
    if ix <= 0x3fe921fb {
        return Some((0, x, 0.0));
    }
    if ix < 0x4002d97c {
        return Some(if hx > 0 {
            let mut z = x - PIO2_1;
            if ix != 0x3ff921fb {
                let y0 = z - PIO2_1T;
                (1, y0, (z - y0) - PIO2_1T)
            } else {
                z -= PIO2_2;
                let y0 = z - PIO2_2T;
                (1, y0, (z - y0) - PIO2_2T)
            }
        } else {
            let mut z = x + PIO2_1;
            if ix != 0x3ff921fb {
                let y0 = z + PIO2_1T;
                (-1, y0, (z - y0) + PIO2_1T)
            } else {
                z += PIO2_2;
                let y0 = z + PIO2_2T;
                (-1, y0, (z - y0) + PIO2_2T)
            }
        });
    }
    if ix <= 0x413921fb {
        let t = x.abs();
        let n = t.mul_add(INVPIO2, HALF) as i32;
        let fnn = n as f64;
        let mut r = (-fnn).mul_add(PIO2_1, t);
        let mut w = fnn * PIO2_1T;
        let mut y0;
        if n < 32 && ix != NPIO2_HW[(n - 1) as usize] {
            y0 = r - w;
        } else {
            let j = ix >> 20;
            y0 = r - w;
            let i = j - ((high(y0) >> 20) & 0x7ff);
            if i > 16 {
                let t = r;
                w = fnn * PIO2_2;
                r = t - w;
                w = fnn.mul_add(PIO2_2T, -((t - r) - w));
                y0 = r - w;
                let i = j - ((high(y0) >> 20) & 0x7ff);
                if i > 49 {
                    let t = r;
                    w = fnn * PIO2_3;
                    r = t - w;
                    w = fnn.mul_add(PIO2_3T, -((t - r) - w));
                    y0 = r - w;
                }
            }
        }
        let y1 = (r - y0) - w;
        return Some(if hx < 0 { (-n, -y0, -y1) } else { (n, y0, y1) });
    }
    // Beyond 2^19·π/2, where V8 runs `__kernel_rem_pio2`: three Cody–Waite steps with the
    // quadrant kept in a float. Deterministic, less precise than V8's (no scene goes there), and
    // no Payne–Hanek table in the module.
    let t = x.abs();
    let fnn = t.mul_add(INVPIO2, HALF).floor();
    let mut r = (-fnn).mul_add(PIO2_1, t);
    let mut w = fnn * PIO2_1T;
    for (p, pt) in [(PIO2_2, PIO2_2T), (PIO2_3, PIO2_3T)] {
        let t = r;
        w = fnn * p;
        r = t - w;
        w = fnn.mul_add(pt, -((t - r) - w));
    }
    let y0 = r - w;
    let y1 = (r - y0) - w;
    let n = (fnn % 4.0) as i32;
    Some(if hx < 0 { (-n, -y0, -y1) } else { (n, y0, y1) })
}

pub fn sin(x: f64) -> f64 {
    let ix = high(x) & 0x7fffffff;
    if ix <= 0x3fe921fb {
        return kernel_sin(x, 0.0, 0);
    }
    if ix >= 0x7ff00000 {
        return f64::NAN; // x − x of an infinity or a NaN
    }
    match rem_pio2(x) {
        Some((n, y0, y1)) => match n & 3 {
            0 => kernel_sin(y0, y1, 1),
            1 => kernel_cos(y0, y1),
            2 => -kernel_sin(y0, y1, 1),
            _ => -kernel_cos(y0, y1),
        },
        None => f64::NAN,
    }
}

pub fn cos(x: f64) -> f64 {
    let ix = high(x) & 0x7fffffff;
    if ix <= 0x3fe921fb {
        return kernel_cos(x, 0.0);
    }
    if ix >= 0x7ff00000 {
        return f64::NAN; // x − x of an infinity or a NaN
    }
    match rem_pio2(x) {
        Some((n, y0, y1)) => match n & 3 {
            0 => kernel_cos(y0, y1),
            1 => -kernel_sin(y0, y1, 1),
            2 => -kernel_cos(y0, y1),
            _ => kernel_sin(y0, y1, 1),
        },
        None => f64::NAN,
    }
}
