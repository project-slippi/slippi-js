import { Character } from "./types";

export type CharacterColor = string;
const DEFAULT_COLOR: CharacterColor = "Default";

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
  colors: [DEFAULT_COLOR],
};

const externalCharacters: CharacterInfo[] = [
  {
    id: Character.CAPTAIN_FALCON,
    name: "Captain Falcon",
    shortName: "Falcon",
    colors: [DEFAULT_COLOR, "Black", "Red", "White", "Green", "Blue"],
  },
  {
    id: Character.DONKEY_KONG,
    name: "Donkey Kong",
    shortName: "DK",
    colors: [DEFAULT_COLOR, "Black", "Red", "Blue", "Green"],
  },
  {
    id: Character.FOX,
    name: "Fox",
    shortName: "Fox",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green"],
  },
  {
    id: Character.GAME_AND_WATCH,
    name: "Mr. Game & Watch",
    shortName: "G&W",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green"],
  },
  {
    id: Character.KIRBY,
    name: "Kirby",
    shortName: "Kirby",
    colors: [DEFAULT_COLOR, "Yellow", "Blue", "Red", "Green", "White"],
  },
  {
    id: Character.BOWSER,
    name: "Bowser",
    shortName: "Bowser",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Black"],
  },
  {
    id: Character.LINK,
    name: "Link",
    shortName: "Link",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Black", "White"],
  },
  {
    id: Character.LUIGI,
    name: "Luigi",
    shortName: "Luigi",
    colors: [DEFAULT_COLOR, "White", "Blue", "Red"],
  },
  {
    id: Character.MARIO,
    name: "Mario",
    shortName: "Mario",
    colors: [DEFAULT_COLOR, "Yellow", "Black", "Blue", "Green"],
  },
  {
    id: Character.MARTH,
    name: "Marth",
    shortName: "Marth",
    colors: [DEFAULT_COLOR, "Red", "Green", "Black", "White"],
  },
  {
    id: Character.MEWTWO,
    name: "Mewtwo",
    shortName: "Mewtwo",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green"],
  },
  {
    id: Character.NESS,
    name: "Ness",
    shortName: "Ness",
    colors: [DEFAULT_COLOR, "Yellow", "Blue", "Green"],
  },
  {
    id: Character.PEACH,
    name: "Peach",
    shortName: "Peach",
    colors: [DEFAULT_COLOR, "Daisy", "White", "Blue", "Green"],
  },
  {
    id: Character.PIKACHU,
    name: "Pikachu",
    shortName: "Pikachu",
    colors: [DEFAULT_COLOR, "Red", "Party Hat", "Cowboy Hat"],
  },
  {
    id: Character.ICE_CLIMBERS,
    name: "Ice Climbers",
    shortName: "ICs",
    colors: [DEFAULT_COLOR, "Green", "Orange", "Red"],
  },
  {
    id: Character.JIGGLYPUFF,
    name: "Jigglypuff",
    shortName: "Puff",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Headband", "Crown"],
  },
  {
    id: Character.SAMUS,
    name: "Samus",
    shortName: "Samus",
    colors: [DEFAULT_COLOR, "Pink", "Black", "Green", "Purple"],
  },
  {
    id: Character.YOSHI,
    name: "Yoshi",
    shortName: "Yoshi",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Yellow", "Pink", "Cyan"],
  },
  {
    id: Character.ZELDA,
    name: "Zelda",
    shortName: "Zelda",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green", "White"],
  },
  {
    id: Character.SHEIK,
    name: "Sheik",
    shortName: "Sheik",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green", "White"],
  },
  {
    id: Character.FALCO,
    name: "Falco",
    shortName: "Falco",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green"],
  },
  {
    id: Character.YOUNG_LINK,
    name: "Young Link",
    shortName: "YLink",
    colors: [DEFAULT_COLOR, "Red", "Blue", "White", "Black"],
  },
  {
    id: Character.DR_MARIO,
    name: "Dr. Mario",
    shortName: "Doc",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green", "Black"],
  },
  {
    id: Character.ROY,
    name: "Roy",
    shortName: "Roy",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green", "Yellow"],
  },
  {
    id: Character.PICHU,
    name: "Pichu",
    shortName: "Pichu",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green"],
  },
  {
    id: Character.GANONDORF,
    name: "Ganondorf",
    shortName: "Ganon",
    colors: [DEFAULT_COLOR, "Red", "Blue", "Green", "Purple"],
  },
];

export function getAllCharacters(): CharacterInfo[] {
  return externalCharacters;
}

export function getCharacterInfo(externalCharacterId: number): CharacterInfo {
  const charInfo = externalCharacters[externalCharacterId];
  if (charInfo) {
    return charInfo;
  }
  return UnknownCharacter;
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
  const color = character.colors[characterColor];
  if (color) {
    return color;
  }
  return DEFAULT_COLOR;
}
