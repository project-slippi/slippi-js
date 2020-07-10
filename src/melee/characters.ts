export type CharacterColor = string;

export interface CharacterInfo {
  id: number;
  name: string;
  shortName: string;
  colors: CharacterColor[];
}

const externalCharacters: CharacterInfo[] = [
  {
    id: 0,
    name: 'Captain Falcon',
    shortName: 'Falcon',
    colors: ['Default', 'Black', 'Red', 'White', 'Green', 'Blue'],
  },
  {
    id: 1,
    name: 'Donkey Kong',
    shortName: 'DK',
    colors: ['Default', 'Black', 'Red', 'Blue', 'Green'],
  },
  {
    id: 2,
    name: 'Fox',
    shortName: 'Fox',
    colors: ['Default', 'Red', 'Blue', 'Green'],
  },
  {
    id: 3,
    name: 'Mr. Game & Watch',
    shortName: 'G&W',
    colors: ['Default', 'Red', 'Blue', 'Green'],
  },
  {
    id: 4,
    name: 'Kirby',
    shortName: 'Kirby',
    colors: ['Default', 'Yellow', 'Blue', 'Red', 'Green', 'White'],
  },
  {
    id: 5,
    name: 'Bowser',
    shortName: 'Bowser',
    colors: ['Default', 'Red', 'Blue', 'Black'],
  },
  {
    id: 6,
    name: 'Link',
    shortName: 'Link',
    colors: ['Default', 'Red', 'Blue', 'Black', 'White'],
  },
  {
    id: 7,
    name: 'Luigi',
    shortName: 'Luigi',
    colors: ['Default', 'White', 'Blue', 'Red'],
  },
  {
    id: 8,
    name: 'Mario',
    shortName: 'Mario',
    colors: ['Default', 'Yellow', 'Black', 'Blue', 'Green'],
  },
  {
    id: 9,
    name: 'Marth',
    shortName: 'Marth',
    colors: ['Default', 'Red', 'Green', 'Black', 'White'],
  },
  {
    id: 10,
    name: 'Mewtwo',
    shortName: 'Mewtwo',
    colors: ['Default', 'Red', 'Blue', 'Green'],
  },
  {
    id: 11,
    name: 'Ness',
    shortName: 'Ness',
    colors: ['Default', 'Yellow', 'Blue', 'Green'],
  },
  {
    id: 12,
    name: 'Peach',
    shortName: 'Peach',
    colors: ['Default', 'Daisy', 'White', 'Blue', 'Green'],
  },
  {
    id: 13,
    name: 'Pikachu',
    shortName: 'Pikachu',
    colors: ['Default', 'Red', 'Party Hat', 'Cowboy Hat'],
  },
  {
    id: 14,
    name: 'Ice Climbers',
    shortName: 'ICs',
    colors: ['Default', 'Green', 'Orange', 'Red'],
  },
  {
    id: 15,
    name: 'Jigglypuff',
    shortName: 'Puff',
    colors: ['Default', 'Red', 'Blue', 'Headband', 'Crown'],
  },
  {
    id: 16,
    name: 'Samus',
    shortName: 'Samus',
    colors: ['Default', 'Pink', 'Black', 'Green', 'Purple'],
  },
  {
    id: 17,
    name: 'Yoshi',
    shortName: 'Yoshi',
    colors: ['Default', 'Red', 'Blue', 'Yellow', 'Pink', 'Cyan'],
  },
  {
    id: 18,
    name: 'Zelda',
    shortName: 'Zelda',
    colors: ['Default', 'Red', 'Blue', 'Green', 'White'],
  },
  {
    id: 19,
    name: 'Sheik',
    shortName: 'Sheik',
    colors: ['Default', 'Red', 'Blue', 'Green', 'White'],
  },
  {
    id: 20,
    name: 'Falco',
    shortName: 'Falco',
    colors: ['Default', 'Red', 'Blue', 'Green'],
  },
  {
    id: 21,
    name: 'Young Link',
    shortName: 'YLink',
    colors: ['Default', 'Red', 'Blue', 'White', 'Black'],
  },
  {
    id: 22,
    name: 'Dr. Mario',
    shortName: 'Doc',
    colors: ['Default', 'Red', 'Blue', 'Green', 'Black'],
  },
  {
    id: 23,
    name: 'Roy',
    shortName: 'Roy',
    colors: ['Default', 'Red', 'Blue', 'Green', 'Yellow'],
  },
  {
    id: 24,
    name: 'Pichu',
    shortName: 'Pichu',
    colors: ['Default', 'Red', 'Blue', 'Green'],
  },
  {
    id: 25,
    name: 'Ganondorf',
    shortName: 'Ganon',
    colors: ['Default', 'Red', 'Blue', 'Green', 'Purple'],
  },
];

export function getAllCharacters(): CharacterInfo[] {
  return externalCharacters;
}

export function getCharacterInfo(externalCharacterId: number): CharacterInfo {
  if (externalCharacterId < 0 || externalCharacterId >= externalCharacters.length) {
    throw new Error(`Invalid character id: ${externalCharacterId}`);
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
