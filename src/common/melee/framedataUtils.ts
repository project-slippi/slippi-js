import framedata from "./framedata.json";

type FramedataCharacter = keyof typeof framedata;

export type Aerial = {
  subactionIndex: number;
  subactionName: string;
  totalFrames: number;
  iasa: number | null;
  autoCancelBefore: number;
  autoCancelAfter: number;
  landingLag: number;
  lcancelledLandingLag: number;
};

export type AerialName = "fair" | "bair" | "nair" | "upair" | "dair";

const characterNames: { [key: number]: FramedataCharacter } = {
  0x00: "Mario",
  0x01: "Fox",
  0x02: "Captain Falcon",
  0x03: "Donkey Kong",
  0x04: "Kirby",
  0x05: "Bowser",
  0x06: "Link",
  0x07: "Sheik",
  0x08: "Ness",
  0x09: "Peach",
  0x0a: "Popo",
  0x0b: "Nana",
  0x0c: "Pikachu",
  0x0d: "Samus",
  0x0e: "Yoshi",
  0x0f: "Jigglypuff",
  0x10: "Mewtwo",
  0x11: "Luigi",
  0x12: "Marth",
  0x13: "Zelda",
  0x14: "Young Link",
  0x15: "Dr. Mario",
  0x16: "Falco",
  0x17: "Pichu",
  0x18: "Mr. Game & Watch",
  0x19: "Ganondorf",
  0x1a: "Roy",
};

export function getAerialFrameData(internalCharacterId: number, aerialName: AerialName): Aerial | undefined {
  const characterName = characterNames[internalCharacterId];
  if (!characterName) {
    return undefined;
  }
  return framedata[characterName][aerialName];
}
