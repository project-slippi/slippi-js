import { Character } from "./types";

export type CharacterColor = string;

export interface CharacterInfo {
  id: number;
  name: string;
  shortName: string;
  colors: CharacterColor[];
}

export const UnknownCharacter: CharacterInfo = {
  id: -1,
  name: "Unknown Character",
  shortName: "Unknown",
  colors: ["Default"],
};

const externalCharacters: CharacterInfo[] = [
  {
    id: Character.CAPTAIN_FALCON,
    name: "Captain Falcon",
    shortName: "Falcon",
    colors: ["Default", "Black", "Red", "White", "Green", "Blue"],
  },
  {
    id: Character.DONKEY_KONG,
    name: "Donkey Kong",
    shortName: "DK",
    colors: ["Default", "Black", "Red", "Blue", "Green"],
  },
  {
    id: Character.FOX,
    name: "Fox",
    shortName: "Fox",
    colors: ["Default", "Red", "Blue", "Green"],
  },
  {
    id: Character.GAME_AND_WATCH,
    name: "Mr. Game & Watch",
    shortName: "G&W",
    colors: ["Default", "Red", "Blue", "Green"],
  },
  {
    id: Character.KIRBY,
    name: "Kirby",
    shortName: "Kirby",
    colors: ["Default", "Yellow", "Blue", "Red", "Green", "White"],
  },
  {
    id: Character.BOWSER,
    name: "Bowser",
    shortName: "Bowser",
    colors: ["Default", "Red", "Blue", "Black"],
  },
  {
    id: Character.LINK,
    name: "Link",
    shortName: "Link",
    colors: ["Default", "Red", "Blue", "Black", "White"],
  },
  {
    id: Character.LUIGI,
    name: "Luigi",
    shortName: "Luigi",
    colors: ["Default", "White", "Blue", "Red"],
  },
  {
    id: Character.MARIO,
    name: "Mario",
    shortName: "Mario",
    colors: ["Default", "Yellow", "Black", "Blue", "Green"],
  },
  {
    id: Character.MARTH,
    name: "Marth",
    shortName: "Marth",
    colors: ["Default", "Red", "Green", "Black", "White"],
  },
  {
    id: Character.MEWTWO,
    name: "Mewtwo",
    shortName: "Mewtwo",
    colors: ["Default", "Red", "Blue", "Green"],
  },
  {
    id: Character.NESS,
    name: "Ness",
    shortName: "Ness",
    colors: ["Default", "Yellow", "Blue", "Green"],
  },
  {
    id: Character.PEACH,
    name: "Peach",
    shortName: "Peach",
    colors: ["Default", "Daisy", "White", "Blue", "Green"],
  },
  {
    id: Character.PIKACHU,
    name: "Pikachu",
    shortName: "Pikachu",
    colors: ["Default", "Red", "Party Hat", "Cowboy Hat"],
  },
  {
    id: Character.ICE_CLIMBERS,
    name: "Ice Climbers",
    shortName: "ICs",
    colors: ["Default", "Green", "Orange", "Red"],
  },
  {
    id: Character.JIGGLYPUFF,
    name: "Jigglypuff",
    shortName: "Puff",
    colors: ["Default", "Red", "Blue", "Headband", "Crown"],
  },
  {
    id: Character.SAMUS,
    name: "Samus",
    shortName: "Samus",
    colors: ["Default", "Pink", "Black", "Green", "Purple"],
  },
  {
    id: Character.YOSHI,
    name: "Yoshi",
    shortName: "Yoshi",
    colors: ["Default", "Red", "Blue", "Yellow", "Pink", "Cyan"],
  },
  {
    id: Character.ZELDA,
    name: "Zelda",
    shortName: "Zelda",
    colors: ["Default", "Red", "Blue", "Green", "White"],
  },
  {
    id: Character.SHEIK,
    name: "Sheik",
    shortName: "Sheik",
    colors: ["Default", "Red", "Blue", "Green", "White"],
  },
  {
    id: Character.FALCO,
    name: "Falco",
    shortName: "Falco",
    colors: ["Default", "Red", "Blue", "Green"],
  },
  {
    id: Character.YOUNG_LINK,
    name: "Young Link",
    shortName: "YLink",
    colors: ["Default", "Red", "Blue", "White", "Black"],
  },
  {
    id: Character.DR_MARIO,
    name: "Dr. Mario",
    shortName: "Doc",
    colors: ["Default", "Red", "Blue", "Green", "Black"],
  },
  {
    id: Character.ROY,
    name: "Roy",
    shortName: "Roy",
    colors: ["Default", "Red", "Blue", "Green", "Yellow"],
  },
  {
    id: Character.PICHU,
    name: "Pichu",
    shortName: "Pichu",
    colors: ["Default", "Red", "Blue", "Green"],
  },
  {
    id: Character.GANONDORF,
    name: "Ganondorf",
    shortName: "Ganon",
    colors: ["Default", "Red", "Blue", "Green", "Purple"],
  },
  {
    id: Character.MASTER_HAND,
    name: "Master Hand",
    shortName: "M-Hand",
    colors: ["Default"],
  },
  {
    id: Character.WIREFRAME_MALE,
    name: "Wireframe Male",
    shortName: "Wire-M",
    colors: ["Default"],
  },
  {
    id: Character.WIREFRAME_FEMALE,
    name: "Wireframe Female",
    shortName: "Wire-F",
    colors: ["Default"],
  },
  {
    id: Character.GIGA_BOWSER,
    name: "Giga Bowser",
    shortName: "G-Bowser",
    colors: ["Default"],
  },
  {
    id: Character.CRAZY_HAND,
    name: "Crazy Hand",
    shortName: "C-Hand",
    colors: ["Default"],
  },
  {
    id: Character.SANDBAG,
    name: "Sandbag",
    shortName: "Sandbag",
    colors: ["Default"],
  },
  {
    id: Character.POPO,
    name: "Popo",
    shortName: "SoPo",
    colors: ["Default", "Green", "Orange", "Red"],
  },
];

export function getAllCharacters(): CharacterInfo[] {
  return externalCharacters;
}

export function getCharacterInfo(externalCharacterId: number): CharacterInfo {
  if (externalCharacterId < 0 || externalCharacterId >= externalCharacters.length) {
    return UnknownCharacter;
  }
  return externalCharacters[externalCharacterId];
}

export function getCharacterShortName(externalCharacterId: number): string {
  const character = getCharacterInfo(externalCharacterId);
  return character.shortName;
}

export function getCharacterName(externalCharacterId: number): string {
  const character = getCharacterInfo(externalCharacterId);
  return character.name;
}

// Return a human-readable color from a characterCode.
export function getCharacterColorName(externalCharacterId: number, characterColor: number): CharacterColor {
  const character = getCharacterInfo(externalCharacterId);
  const colors = character.colors;
  return colors[characterColor];
}
