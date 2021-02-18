import * as Melee from "../src/melee";

let miscMove = { id: 1, name: 'Miscellaneous', shortName: 'misc' }
let unknownMove = { id: -1, name: 'Unknown Move', shortName: 'unknown' }

let venomStage = { id: 22, name: 'Venom' }
let unknownStage = { id: -1, name: 'Unknown Stage' }

let foxCharacter = {
  id: 2,
  name: "Fox",
  shortName: "Fox",
  colors: ["Default", "Red", "Blue", "Green"],
}
let unknownCharacter = {
  id: -1,
  name: "Unknown Character",
  shortName: "Unknown",
  colors: ["Default"],
}

describe("Animations", () => {
  it("returns expected directions", () => {
    console.log(Melee.animations.getDeathDirection(0))
    expect(Melee.animations.getDeathDirection(0)).toEqual('down')
    expect(Melee.animations.getDeathDirection(1)).toEqual('left')
    expect(Melee.animations.getDeathDirection(2)).toEqual('right')
    expect(Melee.animations.getDeathDirection(3)).toEqual('up')
    expect(Melee.animations.getDeathDirection(1234)).toEqual(null)
  });
});

describe("Characters", () => {
  it("returns expected ID value", () => {
    expect(Melee.characters.getCharacterInfo(foxCharacter.id)).toEqual(foxCharacter)
  });
  it("returns UnknownMove when move not found", () => {
    expect(Melee.characters.getCharacterInfo(69)).toEqual(unknownCharacter)
    expect(Melee.characters.UnknownCharacter).toEqual(unknownCharacter)
  });
  it("returns expected ShortName given ID", () => {
    expect(Melee.characters.getCharacterShortName(foxCharacter.id)).toEqual(foxCharacter.shortName)
  });
  it("returns expected character Name given ID", () => {
    expect(Melee.characters.getCharacterName(foxCharacter.id)).toEqual(foxCharacter.name)
  });
  it("returns expected character color given ID and index", () => {
    expect(Melee.characters.getCharacterColorName(foxCharacter.id, 0)).toEqual(foxCharacter.colors[0])
  });
  it("returns expected array of characters", () => {
    expect(Melee.characters.getAllCharacters()[2]).toEqual(foxCharacter)
  });
});

describe("Moves", () => {
  it("returns expected ID value", () => {
    expect(Melee.moves.getMoveInfo(miscMove.id)).toEqual(miscMove)
  });
  it("returns UnknownMove when move not found", () => {
    expect(Melee.moves.getMoveInfo(69)).toEqual(unknownMove)
    expect(Melee.moves.UnknownMove).toEqual(unknownMove)
  });
  it("returns expected ShortName given ID", () => {
    expect(Melee.moves.getMoveShortName(62)).toEqual('edge')
  });
  it("returns expected Move Name given ID", () => {
    expect(Melee.moves.getMoveName(62)).toEqual('Edge Attack')
  });
});

describe("Stages", () => {
  it("returns expected ID value", () => {
    expect(Melee.stages.getStageInfo(venomStage.id)).toEqual(venomStage)
  });
  it("returns UnknownStage when stage not found", () => {
    expect(Melee.stages.getStageInfo(69)).toEqual(unknownStage)
    expect(Melee.stages.UnknownStage).toEqual(unknownStage)
  });
  it("returns expected Move Name given ID", () => {
    expect(Melee.stages.getStageName(venomStage.id)).toEqual(venomStage.name)
  });
});
