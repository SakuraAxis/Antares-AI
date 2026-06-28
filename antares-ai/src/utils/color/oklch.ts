import type { OKLab, OKLCH } from "./types";

export function okLabToOKLCH(lab: OKLab): OKLCH {
  return {
    l: lab.l,
    c: Math.sqrt(lab.a * lab.a + lab.b * lab.b),
    h: Math.atan2(lab.b, lab.a),
  };
}

export function okLCHToOKLab(lch: OKLCH): OKLab {
  return {
    l: lch.l,
    a: lch.c * Math.cos(lch.h),
    b: lch.c * Math.sin(lch.h),
  };
}