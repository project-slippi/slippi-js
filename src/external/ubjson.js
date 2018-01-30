/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
 * Copyright 2013 Art Compiler LLC
 * Copyright 2013 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

/*
  This module implements a builder of UBJSON objects.

     startObject(flags)
     finishObject(size)
     startArray(flags)
     finishArray(size)
     startString(flags)
     finishString(size)
     writeByte(val)
     writeI16(val)
     writeI32(val)
     writeI64(val)
     writeF32(val)
     writeF64(val)

     imported functions

     imports = {
       resizeHeap,
     }

 */

var DEBUG = true;

var assert = !DEBUG
  ? function () { }
  : function (val, str) {
    if ( str === void 0 ) {
      str = "failed!";
    }
    if ( !val ) {
      throw("assert: " + str);
    }
  };

var global = this;

var trace = function trace(str) {
  if (global.console && global.console.log) {
    console.log(str);
  } else if (global.print) {
    print(str);
  } else {
    throw "No trace function defined!";
  }
}

export default (function () {

  var Core = function Core(stdlib, imports, heap) {

    "use asm";

    // BEGIN SNIP

    var pos = 0;
    var bytesU8 = new stdlib.Uint8Array(heap);
    var bytesD32 = new stdlib.Float32Array(heap);
    var bytesD64 = new stdlib.Float64Array(heap);

    var trace = imports.trace;
    var imul = stdlib.Math.imul;
    var pushNull = imports.pushNull;
    var pushTrue = imports.pushTrue;
    var pushFalse = imports.pushFalse;
    var pushInt = imports.pushInt;
    var pushFloat32 = imports.pushFloat32;
    var pushFloat64 = imports.pushFloat64;
    var pushString = imports.pushString;
    var newObject = imports.newObject;
    var newArray = imports.newArray;

    // Markers for UBJSON types
    var $o = 111;
    var $O = 79;
    var $a = 97;
    var $A = 65;
    var $B = 66;
    var $i = 105;
    var $I = 73;
    var $L = 76;
    var $d = 100;
    var $D = 68;
    var $s = 115;
    var $S = 83;
    var $Z = 90;
    var $T = 84;
    var $F = 70;

    var $_ = 95;   // place holder byte

    // Flag bits
    var BIG = 0x00000001;

    // Return the current position in the ArrayBuffer.
    function getPos() {
      return pos | 0;
    }

    function setPos(p) {
      p = p | 0;
      pos = p;
    }

    // BEGIN Builder

    // Write a null value.
    function writeNull() {
      bytesU8[pos] = $Z;
      pos = pos + 1 | 0;
    }

    // Write a true value.
    function writeTrue() {
      bytesU8[pos] = $T;
      pos = pos + 1 | 0;
    }

    // Write a false value.
    function writeFalse() {
      bytesU8[pos] = $F;
      pos = pos + 1 | 0;
    }

    // Write a byte (int8) value.
    function writeByte(val) {
      val = val | 0;
      bytesU8[pos] = $B;
      bytesU8[pos + 1 | 0] = val;
      pos = pos + 2 | 0;
    }

    // Write an int16 value.
    function writeI16(val) {
      val = val | 0;
      bytesU8[pos] = $i;
      bytesU8[pos + 1 | 0] = val >> 8 & 0xFF;
      bytesU8[pos + 2 | 0] = val & 0xFF;
      pos = pos + 3 | 0;
    }

    // Write an int32 value.
    function writeI32(val) {
      val = val | 0;
      bytesU8[pos] = $I;
      bytesU8[pos + 1 | 0] = val >> 24 & 0xFF;
      bytesU8[pos + 2 | 0] = val >> 16 & 0xFF;
      bytesU8[pos + 3 | 0] = val >> 8 & 0xFF;
      bytesU8[pos + 4 | 0] = val & 0xFF;
      pos = pos + 5 | 0;
    }

    // WARNING writeD32() and writeD64() write bytes out with the reverse
    // endian-ness of the host computer. The order is reversed because UBJSON
    // demands big endian-ness and most computers use litte endian as their
    // native encoding. Either way the dependency of this implementation on the
    // native endian-ness of the host computer creates an incompatibility with
    // the UBJSON spec. This bug will only manifest itself when reading and
    // writing UBJSON values from a computer or UBJSON implementation with a
    // different endian-ness. However, these are not use cases that are in scope
    // for the current implementation.

    // Write an float32 value.
    function writeD32(val) {
      val = +val;
      var scratchPos = 0;
      scratchPos = imul(pos + 1, 4) | 0;
      bytesD32[scratchPos >> 2] = val;  // Write out float32 to get bytes.
      bytesU8[pos] = $d;
      // Copy bytes in reverse order to produce big endian on Intel hardward.
      bytesU8[pos + 1 | 0] = bytesU8[scratchPos + 3 | 0];
      bytesU8[pos + 2 | 0] = bytesU8[scratchPos + 2 | 0];
      bytesU8[pos + 3 | 0] = bytesU8[scratchPos + 1 | 0];
      bytesU8[pos + 4 | 0] = bytesU8[scratchPos | 0];
      pos = pos + 5 | 0;
      //trace("pos="+pos);
    }

    // Write an float64 value.
    function writeD64(val) {
      val = +val;
      var scratchPos = 0;
      scratchPos = imul(pos + 1, 8) | 0;
      bytesD64[scratchPos >> 3] = val;  // Write out float64 to get bytes.
      bytesU8[pos] = $D;
      // Copy bytes in reverse order to produce big endian on Intel hardward.
      bytesU8[pos + 1 | 0] = bytesU8[scratchPos + 7 | 0];
      bytesU8[pos + 2 | 0] = bytesU8[scratchPos + 6 | 0];
      bytesU8[pos + 3 | 0] = bytesU8[scratchPos + 5 | 0];
      bytesU8[pos + 4 | 0] = bytesU8[scratchPos + 4 | 0];
      bytesU8[pos + 5 | 0] = bytesU8[scratchPos + 3 | 0];
      bytesU8[pos + 6 | 0] = bytesU8[scratchPos + 2 | 0];
      bytesU8[pos + 7 | 0] = bytesU8[scratchPos + 1 | 0];
      bytesU8[pos + 8 | 0] = bytesU8[scratchPos | 0];
      pos = pos + 9 | 0;
      //trace("pos="+pos);
    }

    // Start an object. Allocate space for a new object. (flags & BIG) means
    // more than 255 properties.
    function startObject(flags) {
      flags = flags | 0;
      if ((flags & BIG | 0) == 0) {
        bytesU8[pos] = $o;
        bytesU8[pos + 1 | 0] = $_;
        pos = pos + 2 | 0;
      } else {
        bytesU8[pos] = $O;
        bytesU8[pos + 1 | 0] = $_;
        bytesU8[pos + 2 | 0] = $_;
        bytesU8[pos + 3 | 0] = $_;
        bytesU8[pos + 4 | 0] = $_;
        pos = pos + 5 | 0;
      }
    }

    // Finish an object. Offset is position before calling startObject().
    function finishObject(offset, count, flags) {
      offset = offset | 0;
      count = count | 0;
      flags = flags | 0;
      if ((flags & BIG | 0) == 0) {
        bytesU8[offset + 1 | 0] = count;
      } else {
        bytesU8[offset + 1 | 0] = count >> 24 & 0xFF;
        bytesU8[offset + 2 | 0] = count >> 16 & 0xFF;
        bytesU8[offset + 3 | 0] = count >> 8 & 0xFF;
        bytesU8[offset + 4 | 0] = count & 0xFF;
      }
    }

    // Start an array. Allocate space for a new array. (flags & BIG) means
    // more than 255 elements.
    function startArray(flags) {
      flags = flags | 0;
      if ((flags & BIG | 0) == 0) {
        bytesU8[pos] = $a;
        bytesU8[pos + 1 | 0] = $_;
        pos = pos + 2 | 0;
      } else {
        bytesU8[pos] = $A;
        bytesU8[pos + 1 | 0] = $_;
        bytesU8[pos + 2 | 0] = $_;
        bytesU8[pos + 3 | 0] = $_;
        bytesU8[pos + 4 | 0] = $_;
        pos = pos + 5 | 0;
      }
    }

    // Finish an array. Offset is position before calling startArray().
    function finishArray(offset, count, flags) {
      offset = offset | 0;
      count = count | 0;
      flags = flags | 0;
      if ((flags & BIG | 0) == 0) {
        bytesU8[offset + 1 | 0] = count;
      } else {
        bytesU8[offset + 1 | 0] = count >> 24 & 0xFF;
        bytesU8[offset + 2 | 0] = count >> 16 & 0xFF;
        bytesU8[offset + 3 | 0] = count >> 8 & 0xFF;
        bytesU8[offset + 4 | 0] = count & 0xFF;
      }
    }

    // Start a string value. Allocate space for a new string. (flags & BIG)
    // means contains more 255 bytes. Call writeStringChar() to add characters,
    // and finishString() to patch the byte count. Notice that characters are
    // encoded as UTF8 so they may consist of more than one byte.
    function startString(flags) {
      flags = flags | 0;
      if ((flags & BIG | 0) == 0) {
        bytesU8[pos] = $s;
        bytesU8[pos + 1 | 0] = $_;
        pos = pos + 2 | 0;
      } else {
        bytesU8[pos] = $S;
        bytesU8[pos + 1 | 0] = $_;
        bytesU8[pos + 2 | 0] = $_;
        bytesU8[pos + 3 | 0] = $_;
        bytesU8[pos + 4 | 0] = $_;
        pos = pos + 5 | 0;
      }
    }

    // Finish a string value. Patch its byte count.
    function finishString(offset, count, flags) {
      offset = offset | 0;
      count = count | 0;
      flags = flags | 0;
      if ((flags & BIG | 0) == 0) {
        bytesU8[offset + 1 | 0] = count;
      } else {
        bytesU8[offset + 1 | 0] = count >> 24 & 0xFF;
        bytesU8[offset + 2 | 0] = count >> 16 & 0xFF;
        bytesU8[offset + 3 | 0] = count >> 8 & 0xFF;
        bytesU8[offset + 4 | 0] = count & 0xFF;
      }
    }

    // Write a UTF8 character into a string value.
    function writeStringChar(val) {
      val = val | 0;
      // FIXME decode multibyte characters.
      bytesU8[pos] = val;
      pos = pos + 1 | 0;
    }
    // END Builder


    // BEGIN Decoder
    // Construct a UBJSON value from a sequence of bytes.
    function decode() {
      var marker = 0;
      var count = 0;
      var i = 0;
      while (1) {
        marker = readI8() | 0;
        //trace("decode() marker=" + marker);
        switch (marker | 0) {
        case 90:  // $Z
          pushNull();
          return;
        case 84:  // $T
          pushTrue();
          return;
        case 70:  // $F
          pushFalse();
          return;
        case 66:  // $B
          pushInt(readI8() | 0);
          return;
        case 105: // $i
          pushInt(readI16() | 0);
          return;
        case 73:  // $I
          pushInt(readI32() | 0);
          return;
        case 100: // $d
          pushFloat32();
          return;
        case 68:  // $D
          pushFloat64();
          return;
        case 115: // $s
          pushString(readI8() | 0)
          return;
        case 83:  // $S
          pushString(readI32() | 0)
          return;
        case 111: // $o
                  //trace("$o");
          count = readI8() | 0;
          for (i = 0; ~~i < ~~count; i = i + 1 | 0) {
            decode();
            decode();
          }
          newObject(count | 0);
          return;
        case 79:  // $O
          count = readI32() | 0;
          for (i = 0; ~~i < ~~count; i = i + 1 | 0) {
            decode();
            decode();
          }
          newObject(count | 0);
          return;
        case 97:  // $a
          count = readI8() | 0;
          for (i = 0; ~~i < ~~count; i = i + 1 | 0) {
            decode();
          }
          newArray(count | 0);
          return;
        case 65:  // $A
          count = readI32() | 0;
          for (i = 0; ~~i < ~~count; i = i + 1 | 0) {
            decode();
          }
          newArray(count | 0);
          return;
        default:
          //trace("done");
          return;
        }
      }
    }

    function readI8() {
      var val = 0;
      val = bytesU8[pos] | 0;
      pos = pos + 1 | 0;
      return val | 0;
    }

    // Read an int16 value.
    function readI16() {
      var val = 0;
      val = bytesU8[pos] << 8 | 0;
      val = (val + (bytesU8[pos + 1 | 0] | 0)) | 0;
      pos = pos + 2 | 0;
      return val | 0;
    }

    // Write an int32 value.
    function readI32() {
      var val = 0;
      val = bytesU8[pos] << 24;
      val = (val + (bytesU8[pos + 1 | 0] << 16 | 0)) | 0;
      val = (val + (bytesU8[pos + 2 | 0] << 8 | 0)) | 0;
      val = (val + (bytesU8[pos + 3 | 0] | 0)) | 0;
      pos = pos + 4 | 0;
      return val | 0;
    }
    // END Decoder
    // END SNIP

    // Exports
    return {
      // Builder functions
      writeNull: writeNull,
      writeTrue: writeTrue,
      writeFalse: writeFalse,
      writeByte: writeByte,
      writeI16: writeI16,
      writeI32: writeI32,
      writeD32: writeD32,
      writeD64: writeD64,
      startObject: startObject,
      finishObject: finishObject,
      startArray: startArray,
      finishArray: finishArray,
      startString: startString,
      finishString: finishString,
      writeStringChar: writeStringChar,
      // Decode function
      decode: decode,
      // Utils
      getPos: getPos,
      setPos: setPos,
    };
  }

  var UBJSON = function UBJSON(buffer) {
    var view = new DataView(buffer);
    var values = [];
    var imports = {
      trace: trace,
      pushNull: function () {
        print("pushNull()");
        values.push(null);
      },
      pushTrue: function () {
        print("pushTrue()");
        values.push(true);
      },
      pushFalse: function () {
        print("pushFalse()");
        values.push(false);
      },
      pushInt: function (val) {
        print("pushInt() val=" + val);
        values.push(val);
      },
      pushFloat32: function () {
        var pos = core.getPos();
        var val = view.getFloat32(pos);
        print("pushFloat32() val=" + val);
        values.push(val);
        core.setPos(pos+4);
      },
      pushFloat64: function () {
        var pos = core.getPos();
        var val = view.getFloat64(pos);
        print("pushFloat64() val=" + val);
        values.push(val);
        core.setPos(pos+8);
      },
      pushString: function (size) {
        print("pushString() size=" + size);
        var start = core.getPos();
        var stop = start + size;
        var val = "";
        for (var i = start; i < stop; i++) {
          val += String.fromCharCode(view.getInt8(i));
        }
        values.push(val);
        core.setPos(stop);
      },
      newObject: function (count) {
        print("newObject() count=" + count);
        var val = {};
        for (var i = count - 1; i >= 0; i--) {
          var v = values.pop();
          var n = values.pop();
          val[n] = v;
        }
        values.push(val);
      },
      newArray: function (count) {
        print("newArray() count=" + count);
        var val = [];
        for (var i = count - 1; i >= 0; i--) {
          var v = values.pop();
          val[i] = v;
        }
        values.push(val);
      },
    }
    var core = Core(global, imports, buffer);
    function decode() {
      core.decode();
      return values.pop();
    }
    var ubjson = Object.create(core);
    ubjson.decode = decode;
    return ubjson;
  }

  // Self test
  function test() {
    var buffer = new ArrayBuffer(4096);
    var ubjson = UBJSON(buffer);
    // TEST Builder functions
    var pos = [];
    var BIG = 0x01;
    pos.push(ubjson.getPos());
    ubjson.startArray(BIG);
    pos.push(ubjson.getPos());
    ubjson.startObject();
    ubjson.writeByte(10);
    pos.push(ubjson.getPos());
    ubjson.startString();
    ubjson.writeStringChar("h".charCodeAt(0));
    ubjson.writeStringChar("e".charCodeAt(0));
    ubjson.writeStringChar("l".charCodeAt(0));
    ubjson.writeStringChar("l".charCodeAt(0));
    ubjson.writeStringChar("o".charCodeAt(0));
    ubjson.finishString(pos.pop(), 5);
    ubjson.finishObject(pos.pop(), 1);
    ubjson.writeI32(0xFFFF);
    ubjson.writeByte(1);
    ubjson.writeD32(1.23);
    ubjson.writeD64(1.23);
    ubjson.writeD32(1.23);
    ubjson.finishArray(pos.pop(), 6, BIG);
    dumpView(new DataView(buffer));
    function dumpView(view) {
      for (var i = 0 ; i < 128 ; ) {
        var s = "";
        for (var j = 0; j < 16; i++, j++) {
          s += view.getUint8(i) + " ";
        }
        trace(s);
      }
    }
    // Test Decode function
    ubjson.setPos(5);
    var value = ubjson.decode();
    print(JSON.stringify(value, null, 2));
  }

  if (DEBUG) {
    test();
  }

  return UBJSON;

})();