// @flow

const valueMarkers = {
  object: "{".charCodeAt(0),
  string: "S".charCodeAt(0),
  uint8: "U".charCodeAt(0),
};

const terminationMarkers = {
  object: "}".charCodeAt(0)
};

class UbjsonDecoder {
  buffer: Uint8Array;
  position: number;
  dataView: DataView;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.position = 0;

    this.dataView = new DataView(buffer.buffer);
  }

  readObject() {
    const shouldContinueRead = () => {
      return this.buffer[this.position] !== terminationMarkers.object;
    };

    const object = {};
    while (shouldContinueRead()) {
      const field = this.readString();
      object[field] = this.readValueAtPosition();
    }

    // Increment past the termination marker
    this.position += 1;

    return object;
  }

  readString() {
    // First we need to read the string length
    const length: number = this.readValueAtPosition();
    if (!Number.isInteger(length)) {
      throw "UBJSON decoder - failed to read string length";
    }

    // Grab current position and update
    const pos = this.position;
    this.position += length;

    // Read string
    const stringBuffer = this.buffer.slice(pos, pos + length);
    return String.fromCharCode.apply(null, stringBuffer);
  }

  readUint8() {
    // Grab current position and update
    const pos = this.position;
    this.position += 1;

    // Read number
    return this.dataView.getUint8(pos);
  }

  readValueAtPosition(): * {
    const valueMarker = this.buffer[this.position];

    // Move position forward by 1
    this.position += 1;

    switch (valueMarker) {
    case valueMarkers.object:
      return this.readObject();
    case valueMarkers.string:
      return this.readString();
    case valueMarkers.uint8:
      return this.readUint8();
    default:
      throw `UBJSON decoder - value type with marker ${valueMarker} is not supported yet.`;
    }
  }

  decode() {
    return this.readValueAtPosition();
  }
}

export function decode(buffer: Uint8Array) {
  const decoder = new UbjsonDecoder(buffer);
  return decoder.decode();
}