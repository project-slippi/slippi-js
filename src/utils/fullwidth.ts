import _ from "lodash";

export function toHalfwidth(str: string): string {
  // Code reference from https://github.com/sampathsris/ascii-fullwidth-halfwidth-convert

  // Converts a fullwidth character to halfwidth
  const convertChar = (charCode: number): number => {
    if (charCode > 0xff00 && charCode < 0xff5f) {
      return 0x0020 + (charCode - 0xff00);
    }

    if (charCode === 0x3000) {
      return 0x0020;
    }

    return charCode;
  };

  const ret = _.map(str, (char) => convertChar(char.charCodeAt(0)));

  return String.fromCharCode(...ret);
}
