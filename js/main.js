document.addEventListener("DOMContentLoaded", () => {
  /**
   * function hsv2hsl
   * @param {number} hue - The hue value (0-360).
   * @param {number} saturation - The saturation value (0-1).
   * @param {number} value - The value (brightness) value (0-1).
   * @returns {Array} The HSL color representation [hue, saturation, lightness].
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
   * @param {number} hue - The hue value (0-360).
   * @param {number} saturation - The saturation value (0-1).
   * @param {number} value - The value (brightness) value (0-1).
   * @returns {Array} The HSL color representation [hue, saturation, lightness].
   */
  const hsv2hsx = (hue, saturation, value, mode) =>
    mode === "hsl" ? hsv2hsl(hue, saturation, value) : [hue, saturation, value];

  /**
   * function pointOnCurve
   * @param curveMethod {String} Defines how the curve is drawn
   * @param i           {Number} Point in curve (used in iteration)
   * @param total       {Number} Total amount of points
   * @param curveAccent {Number} Modifier used for the curveMethod
   * @param min         {Number} Start of the curve [0...1, 0...1]
   * @param max         {Number} Stop of the curve [0...1, 0...1]
   * @returns           {Array} Vector on curve x, y
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
});
