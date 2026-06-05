import characters from "./characters.json";

export type CharacterColor = string;
const DEFAULT_COLOR: CharacterColor = "Default";

export type CharacterInfo = {
  id: number;
  name: string;
  shortName: string;
  colors: CharacterColor[];
};

export const UnknownCharacter: CharacterInfo = {
  id: -1,
  name: "Unknown Character",
  shortName: "Unknown",
  colors: [DEFAULT_COLOR],
};

type CharacterId = keyof typeof characters;

function generateCharacterInfo(
  id: number,
  info?: {
    name: string;
    shortName?: string;
    colors?: CharacterColor[];
  },
): CharacterInfo {
  if (!info) {
    return UnknownCharacter;
  }

  return {
    id,
    name: info.name,
    shortName: info.shortName ?? info.name,
    colors: [DEFAULT_COLOR, ...(info.colors ?? [])],
  };
}

export function getAllCharacters(mode: "playable" | "all" = "playable"): CharacterInfo[] {
  const allCharacters = Object.entries(characters)
    .map(([id, data]) => generateCharacterInfo(parseInt(id, 10), data))
    .sort((a, b) => a.id - b.id);

  if (mode === "playable") {
    // Playable characters are from 0 (Falcon) to 25 (Ganondorf)
    return allCharacters.filter((character) => character.id >= 0 && character.id <= 25);
  }

  return allCharacters;
}

export function getCharacterInfo(externalCharacterId: number): CharacterInfo {
  const data = characters[externalCharacterId.toString() as CharacterId];
  return generateCharacterInfo(externalCharacterId, data);
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
