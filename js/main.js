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

  const hslToHex = (hue, saturation, lightness) => {
    hue /= 360;
    saturation /= 100;
    lightness /= 100;

    let red, green, blue;

    if (saturation === 0) {
      red = green = blue = lightness; // achromatic
    } else {
      const calculateComponent = (primary, secondary, temporary) => {
        if (temporary < 0) temporary += 1;
        if (temporary > 1) temporary -= 1;
        if (temporary < 1 / 6)
          return primary + (secondary - primary) * 6 * temporary;
        if (temporary < 1 / 2) return secondary;
        if (temporary < 2 / 3)
          return primary + (secondary - primary) * (2 / 3 - temporary) * 6;
        return primary;
      };

      const secondaryComponent =
        lightness < 0.5
          ? lightness * (1 + saturation)
          : lightness + saturation - lightness * saturation;
      const primaryComponent = 2 * lightness - secondaryComponent;
      red = calculateComponent(
        primaryComponent,
        secondaryComponent,
        hue + 1 / 3
      );
      green = calculateComponent(primaryComponent, secondaryComponent, hue);
      blue = calculateComponent(
        primaryComponent,
        secondaryComponent,
        hue - 1 / 3
      );
    }

    const toHex = (component) => {
      const hex = Math.round(component * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  };

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
    total = 198,
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

  // Call the function with the provided palette
  const colorPaletteRamp = generateRandomColorRamp({
    total: 13,
    centerHue: 0,
    hueCycle: 0, // 0.1
    curveMethod: "lame",
    curveAccent: 0.03,
    offsetTint: 0,
    offsetShade: 0,
    tintShadeHueShift: 0,
    offsetCurveModTint: 0.036,
    offsetCurveModShade: 0.036,
    minSaturationLight: [0, 0.09],
    maxSaturationLight: [1, 1],
  });

  const neutralPaletteRamp = generateRandomColorRamp({
    total: 16,
    centerHue: 0,
    hueCycle: 0,
    curveMethod: "lame",
    curveAccent: 0,
    offsetTint: 0,
    offsetShade: 0,
    tintShadeHueShift: 0.01,
    offsetCurveModTint: 0.03,
    offsetCurveModShade: 0.01,
    minSaturationLight: [0, 0],
    maxSaturationLight: [0.228, 1],
  });

  const colorPaletteModified = (palette) => {
    let { light, dark } = colorPaletteRamp;
    const lastElement = light.at(-1);
    const [hue, saturation] = lastElement;

    const tonalValues = [
      [hue, 1.0, 0.9],
      [hue, 1.0, 0.95],
      [hue, 1.0, 0.98],
      [hue, 1.0, 1.0],
    ];

    tonalValues.forEach((tonalValue) => light.push(tonalValue));

    return colorPaletteRamp;
  };

  const colorPalette = colorPaletteModified();
  const neutralPalette = neutralPaletteRamp;

  /**
   * Display the color palette
   */
  const main = document.querySelector("main");

  const buildColorElement = (color) => {
    const span = document.createElement("span");

    const [hue, saturation, lightness] = color;
    span.style.width = "48px";
    span.style.height = "48px";
    const hexColor = hslToHex(hue, saturation * 100, lightness * 100);
    span.style.setProperty("background-color", hexColor);

    span.addEventListener("click", () => {
      navigator.clipboard
        .writeText(hexColor)
        .then(() => {
          console.log("Color copied to clipboard:", hexColor);
          span.classList.add("copied");
          // You can display a success message or perform additional actions here
        })
        .catch((err) => {
          console.error("Failed to copy color to clipboard:", err);
          // You can display an error message or handle the error in an appropriate way
        });
    });

    return span;
  };

  const buildColorPalette = (colorPalette, className) => {
    const baseWrapper = document.createElement("div");
    baseWrapper.classList.add(`${className}`);

    colorPalette.forEach((color) => {
      const span = buildColorElement(color);
      baseWrapper.appendChild(span);
    });

    return baseWrapper;
  };

  const lightPalette = buildColorPalette(colorPalette.light, "light-wrapper");
  const neutralLightPalette = buildColorPalette(
    neutralPalette.light,
    "light-wrapper"
  );
  const basePalette = buildColorPalette(colorPalette.base, "base-wrapper");
  const darkPalette = buildColorPalette(colorPalette.dark, "dark-wrapper");
  main.appendChild(lightPalette);
  // main.appendChild(basePalette);
  // main.appendChild(darkPalette);
  main.appendChild(neutralLightPalette);
});
