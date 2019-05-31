const externalCharacters = [{
  id: 0,
  name: "Captain Falcon",
  shortName: "Falcon",
  colors: ["Black", "Red", "White", "Green", "Blue"],
}, {
  id: 1,
  name: "Donkey Kong",
  shortName: "DK",
  colors: ["Black", "Red", "Blue", "Green"],
}, {
  id: 2,
  name: "Fox",
  shortName: "Fox",
  colors: ["Red", "Blue", "Green"],
}, {
  id: 3,
  name: "Mr. Game & Watch",
  shortName: "G&W",
  colors: ["Red", "Blue", "Green"],
}, {
  id: 4,
  name: "Kirby",
  shortName: "Kirby",
  colors: ["Yellow", "Blue", "Red", "Green", "White"],
}, {
  id: 5,
  name: "Bowser",
  shortName: "Bowser",
  colors: ["Red", "Blue", "Black"],
}, {
  id: 6,
  name: "Link",
  shortName: "Link",
  colors: ["Red", "Blue", "Black", "White"],
}, {
  id: 7,
  name: "Luigi",
  shortName: "Luigi",
  colors: ["White", "Blue", "Red"],
}, {
  id: 8,
  name: "Mario",
  shortName: "Mario",
  colors: ["Yellow", "Black", "Blue", "Green"],
}, {
  id: 9,
  name: "Marth",
  shortName: "Marth",
  colors: ["Red", "Green", "Black", "White"],
}, {
  id: 10,
  name: "Mewtwo",
  shortName: "Mewtwo",
  colors: ["Red", "Blue", "Green"],
}, {
  id: 11,
  name: "Ness",
  shortName: "Ness",
  colors: ["Yellow", "Blue", "Green"],
}, {
  id: 12,
  name: "Peach",
  shortName: "Peach",
  colors: ["Daisy", "White", "Blue", "Green"],
}, {
  id: 13,
  name: "Pikachu",
  shortName: "Pikachu",
  colors: ["Red", "Party Hat", "Cowboy Hat"],
}, {
  id: 14,
  name: "Ice Climbers",
  shortName: "ICs",
  colors: ["Green", "Orange", "Red"],
}, {
  id: 15,
  name: "Jigglypuff",
  shortName: "Puff",
  colors: ["Red", "Blue", "Headband", "Crown"],
}, {
  id: 16,
  name: "Samus",
  shortName: "Samus",
  colors: ["Pink", "Black", "Green", "Purple"],
}, {
  id: 17,
  name: "Yoshi",
  shortName: "Yoshi",
  colors: ["Red", "Blue", "Yellow", "Pink", "Cyan"],
}, {
  id: 18,
  name: "Zelda",
  shortName: "Zelda",
  colors: ["Red", "Blue", "Green", "White"],
}, {
  id: 19,
  name: "Sheik",
  shortName: "Sheik",
  colors: ["Red", "Blue", "Green", "White"],
}, {
  id: 20,
  name: "Falco",
  shortName: "Falco",
  colors: ["Red", "Blue", "Green"],
}, {
  id: 21,
  name: "Young Link",
  shortName: "YLink",
  colors: ["Red", "Blue", "White", "Black"],
}, {
  id: 22,
  name: "Dr. Mario",
  shortName: "Doc",
  colors: ["Red", "Blue", "Green", "Black"],
}, {
  id: 23,
  name: "Roy",
  shortName: "Roy",
  colors: ["Red", "Blue", "Green", "Yellow"],
}, {
  id: 24,
  name: "Pichu",
  shortName: "Pichu",
  colors: ["Red", "Blue", "Green"],
}, {
  id: 25,
  name: "Ganondorf",
  shortName: "Ganon",
  colors: ["Red", "Blue", "Green", "Purple"],
}];

export function getAllCharacters() {
  return externalCharacters;
}

export function getCharacterInfo(externalCharacterId) {
  return externalCharacters[externalCharacterId];
}

export function getCharacterShortName(externalCharacterId) {
  const character = getCharacterInfo(externalCharacterId) || {};
  return character.shortName;
}

// Return a human-readable color from a characterCode.
export function getCharacterColorName(externalCharacterId, characterColor) {
  const character = getCharacterInfo(externalCharacterId) || {};
  if (!character || characterColor < 0 || characterColor > len(character)) {
    return null;
  }

  if (characterColor === 0) {
    return "Neutral";
  }

  return character.colors[characterColor-1];
}
