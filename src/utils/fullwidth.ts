import map from "lodash/map";

export function toHalfwidth(str: string): string {
  // Converts a fullwidth character to halfwidth
  const convertChar = (charCode: number): number => {
    /**
     * Standard full width encodings
     * https://en.wikipedia.org/wiki/Halfwidth_and_Fullwidth_Forms_(Unicode_block)
     */
    if (charCode > 0xff00 && charCode < 0xff5f) {
      return 0x0020 + (charCode - 0xff00);
    }

    // space:
    if (charCode === 0x3000) {
      return 0x0020;
    }

    /**
     * Exceptions found in Melee/Japanese keyboards
     */
    // single quote: '
    if (charCode === 0x2019) {
      return 0x0027;
    }

    // double quote: "
    if (charCode === 0x201d) {
      return 0x0022;
    }

    return charCode;
  };

  const ret = map(str, (char) => convertChar(char.charCodeAt(0)));

  return String.fromCharCode(...ret);
}
