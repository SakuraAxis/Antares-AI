import type { RGB, OKLab } from "./types";
import { srgbToLinear, linearToSrgb } from "./srgb";

export function rgbToOKLab(rgb: RGB): OKLab {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const l =
    0.4122214708 * r +
    0.5363325363 * g +
    0.0514459929 * b;

  const m =
    0.2119034982 * r +
    0.6806995451 * g +
    0.1073969566 * b;

  const s =
    0.0883024619 * r +
    0.2817188376 * g +
    0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    l:
      0.2104542553 * l_ +
      0.7936177850 * m_ -
      0.0040720468 * s_,

    a:
      1.9779984951 * l_ -
      2.4285922050 * m_ +
      0.4505937099 * s_,

    b:
      0.0259040371 * l_ +
      0.7827717662 * m_ -
      0.8086757660 * s_,
  };
}

export function okLabToRGB(lab: OKLab): RGB {
  const l_ =
    lab.l +
    0.3963377774 * lab.a +
    0.2158037573 * lab.b;

  const m_ =
    lab.l -
    0.1055613458 * lab.a -
    0.0638541728 * lab.b;

  const s_ =
    lab.l -
    0.0894841775 * lab.a -
    1.2914855480 * lab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: linearToSrgb(
      +4.0767416621 * l -
      3.3077115913 * m +
      0.2309699292 * s
    ),

    g: linearToSrgb(
      -1.2684380046 * l +
      2.6097574011 * m -
      0.3413193965 * s
    ),

    b: linearToSrgb(
      -0.0041960863 * l -
      0.7034186147 * m +
      1.7076147010 * s
    ),
  };
}