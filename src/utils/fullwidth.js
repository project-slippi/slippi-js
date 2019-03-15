export function toHalfwidth(str) {
  // Code reference from https://github.com/sampathsris/ascii-fullwidth-halfwidth-convert

  // Converts a fullwidth character to halfwidth
  const convertChar = (charCode) => {
    if (0xFF00 < charCode && charCode < 0xFF5F) {
      return 0x0020 + (charCode - 0xFF00);
    }

    if (0x3000 === charCode) {
      return 0x0020;
    }

    return charCode;
  };

  let ret = [];

  for (let char of str) {
      ret.push(convertChar(char.charCodeAt()));
  }

  return String.fromCharCode.apply(String, ret);
}