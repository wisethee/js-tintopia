document.addEventListener("DOMContentLoaded", () => {
  /**
   * function hsv2hsl
   * @param   {number} hue         The hue value (0-360).
   * @param   {number} saturation  The saturation value (0-1).
   * @param   {number} value       The value (brightness) value (0-1).
   * @returns {Array}              The HSL color representation [hue, saturation, lightness].
   */
  const hsv2hsl = (
    hue,
    saturation,
    value,
    lightness = value - (value * saturation) / 2,
    minLightness = Math.min(lightness, 1 - lightness)
  ) => [hue, minLightness ? (value - lightness) / minLightness : 0, lightness];

  /**
   * function hsv2hsx
   * @param   {number} hue         The hue value (0-360).
   * @param   {number} saturation  The saturation value (0-1).
   * @param   {number} value       The value (brightness) value (0-1).
   * @returns {Array}              The HSL color representation [hue, saturation, lightness].
   */
  const hsv2hsx = (hue, saturation, value, mode) =>
    mode === "hsl" ? hsv2hsl(hue, saturation, value) : [hue, saturation, value];

  /**
   * function pointOnCurve
   * @param   {String} curveMethod  Defines how the curve is drawn
   * @param   {Number} i            Point in curve (used in iteration)
   * @param   {Number} total        Total amount of points
   * @param   {Number} curveAccent  Modifier used for the curveMethod
   * @param   {Number} min          Start of the curve [0...1, 0...1]
   * @param   {Number} max          Stop of the curve [0...1, 0...1]
   * @returns {Array}               Vector on curve x, y
   */
  const pointOnCurve = (
    curveMethod,
    i,
    total,
    curveAccent,
    min = [0, 0],
    max = [1, 1]
  ) => {
    const limit = Math.PI / 2;
    const slice = limit / total;
    const percentile = i / total;

    let x = 0;
    let y = 0;

    switch (curveMethod) {
      case "lame": {
        const t = percentile * limit;
        const exp = 2 / (2 + 20 * curveAccent);
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        x = Math.sign(cosT) * Math.abs(cosT) ** exp;
        y = Math.sign(sinT) * Math.abs(sinT) ** exp;
        break;
      }
      case "arc": {
        y = Math.cos(-Math.PI / 2 + i * slice + curveAccent);
        x = Math.sin(Math.PI / 2 + i * slice - curveAccent);
        break;
      }
      case "pow": {
        x = Math.pow(1 - percentile, 1 - curveAccent);
        y = Math.pow(percentile, 1 - curveAccent);
        break;
      }
      case "powY": {
        x = Math.pow(1 - percentile, curveAccent);
        y = Math.pow(percentile, 1 - curveAccent);
        break;
      }
      case "powX": {
        x = Math.pow(percentile, curveAccent);
        y = Math.pow(percentile, 1 - curveAccent);
        break;
      }
      case "function": {
        x = curveMethod(percentile)[0];
        y = curveMethod(percentile)[1];
        break;
      }
      default: {
        throw new Error(
          `pointOnCurve() curveAccent parameter is expected to be "lame" | "arc" | "pow" | "powY" | "powX" or a function but \`${curveMethod}\` given.`
        );
      }
    }

    x = min[0] + Math.min(Math.max(x, 0), 1) * (max[0] - min[0]);
    y = min[1] + Math.min(Math.max(y, 0), 1) * (max[1] - min[1]);

    return [x, y];
  };

  /**
   * function generateRandomColorRamp
   * @param   {Number}  total                Total amount of colors
   * @param   {Number}  centerHue            Hue of the center color
   * @param   {Number}  hueCycle             Hue cycle of the color ramp
   * @param   {Number}  offsetTint           Offset of the tint colors
   * @param   {Number}  offsetShade          Offset of the shade colors
   * @param   {Number}  curveAccent          Modifier used for the curveMethod
   * @param   {Number}  tintShadeHueShift    Hue shift of the tint and shade colors
   * @param   {String}  curveMethod          Defines how the curve is drawn
   * @param   {Number}  offsetCurveModTint   Offset of the tint curve
   * @param   {Number}  offsetCurveModShade  Offset of the shade curve
   * @param   {Array}   minSaturationLight   Start of the curve [0...1, 0...1]
   * @param   {Array}   maxSaturationLight   Stop of the curve [0...1, 0...1]
   * @param   {String}  colorModel           Color model to use
   * @returns {Object}                       Object containing the color ramp
   */
  function generateRandomColorRamp({
    total = 3,
    centerHue = 0,
    hueCycle = 0.3,
    offsetTint = 0.1,
    offsetShade = 0.1,
    curveAccent = 0,
    tintShadeHueShift = 0.1,
    curveMethod = "arc",
    offsetCurveModTint = 0.03,
    offsetCurveModShade = 0.03,
    minSaturationLight = [0, 0],
    maxSaturationLight = [1, 1],
    colorModel = "hsl",
  } = {}) {
    const baseColors = [];
    const lightColors = [];
    const darkColors = [];

    for (let i = 1; i < total + 1; i++) {
      const [x, y] = pointOnCurve(
        curveMethod,
        i,
        total + 1,
        curveAccent,
        minSaturationLight,
        maxSaturationLight
      );
      const h =
        (360 +
          (-180 * hueCycle +
            (centerHue + i * (360 / (total + 1)) * hueCycle))) %
        360;

      const hsl = hsv2hsx(h, x, y, colorModel);

      baseColors.push(hsl);

      const [xl, yl] = pointOnCurve(
        curveMethod,
        i,
        total + 1,
        curveAccent + offsetCurveModTint,
        minSaturationLight,
        maxSaturationLight
      );

      const hslLight = hsv2hsx(h, xl, yl, colorModel);

      lightColors.push([
        (h + 360 * tintShadeHueShift) % 360,
        hslLight[1] - offsetTint,
        hslLight[2] + offsetTint,
      ]);

      const [xd, yd] = pointOnCurve(
        curveMethod,
        i,
        total + 1,
        curveAccent - offsetCurveModShade,
        minSaturationLight,
        maxSaturationLight
      );

      const hslDark = hsv2hsx(h, xd, yd, colorModel);

      darkColors.push([
        (360 + (h - 360 * tintShadeHueShift)) % 360,
        hslDark[1] - offsetShade,
        hslDark[2] - offsetShade,
      ]);
    }

    return {
      light: lightColors,
      dark: darkColors,
      base: baseColors,
      all: [...lightColors, ...baseColors, ...darkColors],
    };
  }
});
