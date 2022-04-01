import characters from "./characters.json";

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

type CharacterId = keyof typeof characters;

export function getCharacterInfo(externalCharacterId: number): CharacterInfo {
  const charInfo = characters[externalCharacterId as unknown as CharacterId];
  if (charInfo) {
    return {
      id: externalCharacterId,
      name: charInfo.name,
      shortName: charInfo.shortName,
      colors: charInfo.colors,
    };
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
