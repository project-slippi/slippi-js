import fs from "fs";

import { Command, Frames, SlippiGame } from "../src/node/index.js";

// Internal character ids
const DONKEY_KONG = 0x03;
const KIRBY = 0x04;
const BOWSER = 0x05;
const PEACH = 0x09;
const GAME_AND_WATCH = 0x18;

// The eight bytes appended to Post Frame Update in 3.21.0 (offsets 0x55-0x5C)
type StoredState = {
  storedCharge: number;
  spentBitFlags: number;
  wallJumpsUsed: number;
  characterByte: number;
  characterValue: { float: number } | { int: number };
};

function storedStateBytes(state: StoredState): Uint8Array {
  const bytes = new Uint8Array(8);
  const view = new DataView(bytes.buffer);
  view.setUint8(0, state.storedCharge);
  view.setUint8(1, state.spentBitFlags);
  view.setUint8(2, state.wallJumpsUsed);
  view.setUint8(3, state.characterByte);
  if ("float" in state.characterValue) {
    view.setFloat32(4, state.characterValue.float);
  } else {
    view.setInt32(4, state.characterValue.int);
  }
  return bytes;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

// Wraps the raw event stream the way a .slp file does, with empty metadata
function slpFile(raw: Uint8Array): Uint8Array {
  const header = new Uint8Array([0x7b, 0x55, 0x03, 0x72, 0x61, 0x77, 0x5b, 0x24, 0x55, 0x23, 0x6c, 0, 0, 0, 0]);
  new DataView(header.buffer).setUint32(11, raw.length);
  const metadata = new Uint8Array([0x55, 0x08, ...new TextEncoder().encode("metadata"), 0x7b, 0x7d, 0x7d]);
  return concat([header, raw, metadata]);
}

type SyntheticPlayer = { internalCharacterId: number; externalCharacterId: number; stored: StoredState };

// A small replay written from scratch: Event Payloads, Game Start, a few frames and Game End
function syntheticReplay(version: [number, number, number], players: SyntheticPlayer[], frameCount = 3): Uint8Array {
  const atLeast = (minor: number) => version[0] > 3 || (version[0] === 3 && version[1] >= minor);
  // Game Start grew to 812 bytes in 3.20.0 (ranked rating and bot status), Post Frame to 92 in 3.21.0
  const gameStartSize = atLeast(20) ? 812 : 760;
  const postFrameSize = atLeast(21) ? 92 : 84;
  const sizes: [number, number][] = [
    [Command.GAME_START, gameStartSize],
    [Command.PRE_FRAME_UPDATE, 66],
    [Command.POST_FRAME_UPDATE, postFrameSize],
    [Command.GAME_END, 6],
    [Command.FRAME_START, 12],
    [Command.FRAME_BOOKEND, 8],
  ];
  const event = (command: Command): [Uint8Array, DataView] => {
    const bytes = new Uint8Array(1 + sizes.find(([c]) => c === command)![1]);
    bytes[0] = command;
    return [bytes, new DataView(bytes.buffer)];
  };
  const events: Uint8Array[] = [];

  const payloads = new Uint8Array(2 + sizes.length * 3);
  payloads[0] = Command.MESSAGE_SIZES;
  payloads[1] = 1 + sizes.length * 3;
  sizes.forEach(([command, size], i) => {
    payloads[2 + i * 3] = command;
    new DataView(payloads.buffer).setUint16(3 + i * 3, size);
  });
  events.push(payloads);

  const [gameStart, gameStartView] = event(Command.GAME_START);
  gameStart.set(version, 0x1);
  for (let i = 0; i < 4; i++) {
    gameStartView.setUint8(0x65 + i * 0x24, players[i]?.externalCharacterId ?? 0);
    gameStartView.setUint8(0x66 + i * 0x24, players[i] ? 0 : 3); // 0 = human, 3 = empty
  }
  events.push(gameStart);

  for (let frame = Frames.FIRST; frame < Frames.FIRST + frameCount; frame++) {
    const [frameStart, frameStartView] = event(Command.FRAME_START);
    frameStartView.setInt32(0x1, frame);
    events.push(frameStart);
    players.forEach((player, playerIndex) => {
      const [pre, preView] = event(Command.PRE_FRAME_UPDATE);
      preView.setInt32(0x1, frame);
      preView.setUint8(0x5, playerIndex);
      events.push(pre);

      const [post, postView] = event(Command.POST_FRAME_UPDATE);
      postView.setInt32(0x1, frame);
      postView.setUint8(0x5, playerIndex);
      postView.setUint8(0x7, player.internalCharacterId);
      postView.setFloat32(0x16, 12.5); // percent
      postView.setUint8(0x21, 4); // stocks
      postView.setUint16(0x53, 100 + playerIndex); // instance id, the last field before 3.21.0
      if (postFrameSize === 92) {
        post.set(storedStateBytes(player.stored), 0x55);
      }
      events.push(post);
    });
    const [bookend, bookendView] = event(Command.FRAME_BOOKEND);
    bookendView.setInt32(0x1, frame);
    bookendView.setInt32(0x5, frame);
    events.push(bookend);
  }

  const [gameEnd, gameEndView] = event(Command.GAME_END);
  gameEndView.setUint8(0x1, 2);
  gameEndView.setInt8(0x2, -1);
  events.push(gameEnd);

  return slpFile(concat(events));
}

// The method used to size the change: copies a real replay with `extra` bytes appended to every
// Post Frame Update (and its Event Payloads entry raised to match), optionally with a new version
function widenPostFrames(
  slp: Uint8Array,
  extra: (frame: number, playerIndex: number, internalCharacterId: number) => Uint8Array,
  extraLength: number,
  version?: [number, number, number],
): Uint8Array {
  const fileView = new DataView(slp.buffer, slp.byteOffset, slp.byteLength);
  const rawLength = fileView.getUint32(11);
  const raw = slp.subarray(15, 15 + rawLength);
  const rawView = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const metadata = slp.subarray(15 + rawLength);

  const payloadsLength = raw[1]!;
  const sizes: { [command: number]: number } = {};
  const payloads = raw.slice(0, 2 + payloadsLength - 1);
  for (let at = 2; at < 1 + payloadsLength; at += 3) {
    sizes[raw[at]!] = rawView.getUint16(at + 1);
    if (raw[at] === Command.POST_FRAME_UPDATE) {
      new DataView(payloads.buffer).setUint16(at + 1, sizes[Command.POST_FRAME_UPDATE]! + extraLength);
    }
  }

  const events: Uint8Array[] = [payloads];
  let pos = 1 + payloadsLength;
  while (pos < raw.length) {
    const command = raw[pos]!;
    const ev = raw.slice(pos, pos + 1 + sizes[command]!);
    if (command === Command.GAME_START && version) {
      ev.set(version, 0x1);
    }
    events.push(ev);
    if (command === Command.POST_FRAME_UPDATE) {
      const evView = new DataView(ev.buffer);
      events.push(extra(evView.getInt32(0x1), ev[0x5]!, ev[0x7]!));
    }
    pos += 1 + sizes[command]!;
  }
  const out = concat(events);
  const header = slp.slice(0, 15);
  new DataView(header.buffer).setUint32(11, out.length);
  return concat([header, out, metadata]);
}

const players: SyntheticPlayer[] = [
  {
    // Fully charged Giant Punch, aerial tether used (everyone has that bit), two wall jumps
    internalCharacterId: DONKEY_KONG,
    externalCharacterId: 1,
    stored: { storedCharge: 10, spentBitFlags: 0x10, wallJumpsUsed: 2, characterByte: 0, characterValue: { int: 0 } },
  },
  {
    // Oil Panic holding 2 shots worth 21 damage; last Judge number 6, the one before 3
    internalCharacterId: GAME_AND_WATCH,
    externalCharacterId: 3,
    stored: { storedCharge: 2, spentBitFlags: 0, wallJumpsUsed: 0, characterByte: 0x36, characterValue: { int: 21 } },
  },
  {
    // Peach after a float, Toad lift spent, 87 float frames were left
    internalCharacterId: PEACH,
    externalCharacterId: 12,
    stored: { storedCharge: 0, spentBitFlags: 0x09, wallJumpsUsed: 0, characterByte: 0, characterValue: { float: 87 } },
  },
  {
    // Kirby with Bowser's ability and his own Hammer lift spent
    internalCharacterId: KIRBY,
    externalCharacterId: 4,
    stored: {
      storedCharge: 0,
      spentBitFlags: 0x02,
      wallJumpsUsed: 1,
      characterByte: BOWSER,
      characterValue: { float: 312.5 },
    },
  },
];

describe("when reading the stored state in Post Frame Update", () => {
  it("should read the 3.21.0 fields of a synthetic replay", () => {
    const game = new SlippiGame(syntheticReplay([3, 21, 0], players));
    expect(game.getSettings()!.slpVersion).toBe("3.21.0");
    const frames = game.getFrames();
    expect(Object.keys(frames)).toHaveLength(3);
    for (let frame = Frames.FIRST; frame < Frames.FIRST + 3; frame++) {
      players.forEach((player, playerIndex) => {
        const post = frames[frame]!.players[playerIndex]!.post;
        const value = player.stored.characterValue;
        expect(post.internalCharacterId).toBe(player.internalCharacterId);
        expect(post.instanceId).toBe(100 + playerIndex);
        expect(post.storedCharge).toBe(player.stored.storedCharge);
        expect(post.spentBitFlags).toBe(player.stored.spentBitFlags);
        expect(post.wallJumpsUsed).toBe(player.stored.wallJumpsUsed);
        expect(post.characterByte).toBe(player.stored.characterByte);
        expect(post.characterValue).toBe("float" in value ? value.float : value.int);
      });
    }
    // Mr. Game & Watch's value is an int32, so 21 is not read as the float with the same bits
    expect(frames[Frames.FIRST]!.players[1]!.post.characterValue).toBe(21);
    // The two Judge numbers are a nibble each
    const judges = frames[Frames.FIRST]!.players[1]!.post.characterByte!;
    expect([judges & 0x0f, judges >> 4]).toEqual([6, 3]);
  });

  it.each([
    [3, 20, 0],
    [3, 19, 1],
  ] as [number, number, number][])(
    "should read the fields as missing in a replay older than 3.21.0 (%i.%i.%i)",
    (...version) => {
      const game = new SlippiGame(syntheticReplay(version, players));
      expect(game.getSettings()!.slpVersion).toBe(version.join("."));
      const post = game.getFrames()[Frames.FIRST]!.players[1]!.post;
      expect(post.instanceId).toBe(101);
      expect(post.storedCharge).toBeUndefined();
      expect(post.spentBitFlags).toBeUndefined();
      expect(post.wallJumpsUsed).toBeUndefined();
      expect(post.characterByte).toBeUndefined();
      expect(post.characterValue).toBeUndefined();
    },
  );

  it("should read every existing field of a real replay the same once the 8 bytes are appended", () => {
    const original = new Uint8Array(fs.readFileSync("slp/wavedash-1.slp"));
    const extra = (frame: number, playerIndex: number) =>
      storedStateBytes({
        storedCharge: (frame + playerIndex) & 0xff,
        spentBitFlags: playerIndex === 0 ? 0x1f : 0,
        wallJumpsUsed: frame & 0x07,
        characterByte: 0x40 + playerIndex,
        characterValue: { float: frame / 4 },
      });
    const widened = new SlippiGame(widenPostFrames(original, extra, 8, [3, 21, 0]));
    const before = new SlippiGame(original).getFrames();
    const after = widened.getFrames();

    expect(widened.getSettings()!.slpVersion).toBe("3.21.0");
    expect(Object.keys(after)).toEqual(Object.keys(before));
    let checked = 0;
    for (const frame of Object.keys(before).map(Number)) {
      for (const [playerIndex, player] of Object.entries(before[frame]!.players)) {
        const index = Number(playerIndex);
        const post = after[frame]!.players[index]!.post;
        const { storedCharge, spentBitFlags, wallJumpsUsed, characterByte, characterValue, ...existing } = post;
        expect(existing).toEqual(player!.post);
        expect(after[frame]!.players[index]!.pre).toEqual(player!.pre);
        expect(storedCharge).toBe((frame + index) & 0xff);
        expect(spentBitFlags).toBe(index === 0 ? 0x1f : 0);
        expect(wallJumpsUsed).toBe(frame & 0x07);
        expect(characterByte).toBe(0x40 + index);
        expect(characterValue).toBe(frame / 4);
        expect(player!.post.storedCharge).toBeUndefined();
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });
});
