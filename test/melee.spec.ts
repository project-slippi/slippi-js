import * as Melee from "../src/common/melee";

const miscMove = { id: 1, name: "Miscellaneous", shortName: "misc" };
const unknownMove = { id: -1, name: "Unknown Move", shortName: "unknown" };

const venomStage = { id: 22, name: "Venom" };
const unknownStage = { id: -1, name: "Unknown Stage" };

const foxCharacter = {
  id: 2,
  name: "Fox",
  shortName: "Fox",
  colors: ["Default", "Red", "Blue", "Green"],
};

const unknownCharacter = {
  id: -1,
  name: "Unknown Character",
  shortName: "Unknown",
  colors: ["Default"],
};

describe("when fetching animations", () => {
  it("should return the expected death directions", () => {
    expect(Melee.animations.getDeathDirection(0)).toEqual("down");
    expect(Melee.animations.getDeathDirection(1)).toEqual("left");
    expect(Melee.animations.getDeathDirection(2)).toEqual("right");
    expect(Melee.animations.getDeathDirection(3)).toEqual("up");
    expect(Melee.animations.getDeathDirection(1234)).toEqual(null);
  });
});

describe("when fetching character information", () => {
  it("should return the expected ID value", () => {
    expect(Melee.characters.getCharacterInfo(foxCharacter.id)).toEqual(foxCharacter);
  });

  it("should handle unknown characters", () => {
    expect(Melee.characters.getCharacterInfo(69)).toEqual(unknownCharacter);
    expect(Melee.characters.UnknownCharacter).toEqual(unknownCharacter);
  });

  it("should return the correct character short name", () => {
    expect(Melee.characters.getCharacterShortName(foxCharacter.id)).toEqual(foxCharacter.shortName);
  });

  it("should return the correct character name", () => {
    expect(Melee.characters.getCharacterName(foxCharacter.id)).toEqual(foxCharacter.name);
  });

  it("should return the correct character color", () => {
    expect(Melee.characters.getCharacterColorName(foxCharacter.id, 0)).toEqual(foxCharacter.colors[0]);
  });

  it("should return the default color if the color doesn't exist", () => {
    expect(Melee.characters.getCharacterColorName(foxCharacter.id, 10)).toEqual(foxCharacter.colors[0]);
  });

  it("should return an array of all characters", () => {
    expect(Melee.characters.getAllCharacters()[2]).toEqual(foxCharacter);
  });
});

describe("when fetching move information", () => {
  it("should return the correct move from an ID", () => {
    expect(Melee.moves.getMoveInfo(miscMove.id)).toEqual(miscMove);
  });

  it("should handle unknown moves", () => {
    expect(Melee.moves.getMoveInfo(69)).toEqual(unknownMove);
    expect(Melee.moves.UnknownMove).toEqual(unknownMove);
  });

  it("should return the right move short name", () => {
    expect(Melee.moves.getMoveShortName(62)).toEqual("edge");
  });

  it("should return the right move name", () => {
    expect(Melee.moves.getMoveName(62)).toEqual("Edge Attack");
  });
});

describe("when fetching stage information", () => {
  it("should return the stage from an ID", () => {
    expect(Melee.stages.getStageInfo(venomStage.id)).toEqual(venomStage);
  });

  it("should handle unknown stages", () => {
    expect(Melee.stages.getStageInfo(69)).toEqual(unknownStage);
    expect(Melee.stages.UnknownStage).toEqual(unknownStage);
  });

  it("should return the right stage name from an ID", () => {
    expect(Melee.stages.getStageName(venomStage.id)).toEqual(venomStage.name);
  });
});
