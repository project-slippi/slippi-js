import _ from 'lodash';

export function toHalfwidth(str) {
  // Code reference from https://github.com/sampathsris/ascii-fullwidth-halfwidth-convert

  // Converts a fullwidth character to halfwidth
  const convertChar = (charCode) => {
    if (charCode > 0xFF00 && charCode < 0xFF5F) {
      return 0x0020 + (charCode - 0xFF00);
    }

    if (charCode === 0x3000) {
      return 0x0020;
    }

    return charCode;
  };

  const ret = _.map(str, (char) => (
    convertChar(char.charCodeAt())
  ));

  return String.fromCharCode(...ret);
}
