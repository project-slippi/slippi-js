import { SlippiGame } from "../src/node/index";
import { getGameEnd, openSlpFile } from "../src/common/utils/slpReader";
import { SlpFileInputRef } from "../src/node/utils/slpFileInputRef";

describe("when reading game end directly", () => {
  it("should return the same game end object", () => {
    const game = new SlippiGame("slp/test.slp");
    const gameEnd = game.getGameEnd()!;

    const manualGameEnd = getManualGameEnd("slp/test.slp")!;
    expect(gameEnd.gameEndMethod).toEqual(manualGameEnd.gameEndMethod);
    expect(gameEnd.lrasInitiatorIndex).toEqual(manualGameEnd.lrasInitiatorIndex);
    expect(gameEnd.placements.length).toEqual(manualGameEnd.placements.length);
  });

  it("should return the correct placings for 2 player games", () => {
    const manualGameEnd = getManualGameEnd("slp/placementsTest/ffa_1p2p_winner_2p.slp")!;
    const placements = manualGameEnd.placements!;
    expect(placements).toHaveLength(4);
    expect(placements[0].position).toBe(1); // player in port 1 is on second place
    expect(placements[0].playerIndex).toBe(0);
    expect(placements[1].position).toBe(0); // player in port 2 is on first place
    expect(placements[1].playerIndex).toBe(1);
  });

  it("should return placings for 3 player games", () => {
    let manualGameEnd = getManualGameEnd("slp/placementsTest/ffa_1p2p3p_winner_3p.slp")!;
    let placements = manualGameEnd.placements!;
    expect(placements).toBeDefined();
    expect(placements).toHaveLength(4);

    expect(placements[0].playerIndex).toBe(0);
    expect(placements[1].playerIndex).toBe(1);
    expect(placements[2].playerIndex).toBe(2);
    expect(placements[3].playerIndex).toBe(3);

    expect(placements[0].position).toBe(1); // Expect player 1 to be on second place
    expect(placements[1].position).toBe(2); // Expect player 2 to be on third place
    expect(placements[2].position).toBe(0); // Expect player 3 to be first place
    expect(placements[3].position).toBe(-1); // Expect player 4 to not be present

    manualGameEnd = getManualGameEnd("slp/placementsTest/ffa_1p2p4p_winner_4p.slp")!;
    placements = manualGameEnd.placements!;
    expect(placements).toBeDefined();
    expect(placements).toHaveLength(4);

    expect(placements[0].playerIndex).toBe(0);
    expect(placements[1].playerIndex).toBe(1);
    expect(placements[2].playerIndex).toBe(2);
    expect(placements[3].playerIndex).toBe(3);

    expect(placements[0].position).toBe(1); // Expect player 1 to be on second place
    expect(placements[1].position).toBe(2); // Expect player 2 to be on third place
    expect(placements[2].position).toBe(-1); // Expect player 3 to not be present
    expect(placements[3].position).toBe(0); // Expect player 4 to be first place
  });
});

function getManualGameEnd(filePath: string) {
  const ref = new SlpFileInputRef(filePath);
  const slpfile = openSlpFile(ref);
  const gameEnd = getGameEnd(slpfile);
  ref.close();
  return gameEnd;
}
