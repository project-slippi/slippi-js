import _ from "lodash";

import { SlippiGame } from "../src/node/index";

describe("when determining placings", () => {
  it("should return empty placings for older slp files", () => {
    const game = new SlippiGame("slp/test.slp");
    const placements = game.getGameEnd()!.placements!;
    // Test Placements
    expect(placements).toHaveLength(4);
    // Expect empty placements
    expect(placements[0]!.position).toBeUndefined();
    expect(placements[1]!.position).toBeUndefined();
    expect(placements[2]!.position).toBeUndefined();
    expect(placements[3]!.position).toBeUndefined();
  });

  describe("when handling LRAS", () => {
    it("should award the winner to the non-LRAS player", () => {
      const game = new SlippiGame("slp/unranked_game1.slp");
      const gameEnd = game.getGameEnd()!;
      const winners = game.getWinners();
      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).not.toEqual(gameEnd.lrasInitiatorIndex);
      expect(winners[0]!.playerIndex).toEqual(1);
    });
  });

  describe("when the game mode is Free for All", () => {
    it("should find the winner", () => {
      const game = new SlippiGame("slp/placementsTest/ffa_1p2p_winner_2p.slp");
      const winners = game.getWinners();
      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(1);
      expect(winners[0]!.position).toBe(0);
    });

    it("should return placings for 2 player games", () => {
      const game = new SlippiGame("slp/placementsTest/ffa_1p2p_winner_2p.slp");
      const placements = game.getGameEnd()!.placements!;
      expect(placements).toHaveLength(4);
      expect(placements[0]!.position).toBe(1); // player in port 1 is on second place
      expect(placements[0]!.playerIndex).toBe(0);
      expect(placements[1]!.position).toBe(0); // player in port 2 is on first place
      expect(placements[1]!.playerIndex).toBe(1);
    });

    it("should return placings for 3 player games", () => {
      let game = new SlippiGame("slp/placementsTest/ffa_1p2p3p_winner_3p.slp");
      let placements = game.getGameEnd()?.placements!;
      expect(placements).toBeDefined();
      expect(placements).toHaveLength(4);

      expect(placements[0]!.playerIndex).toBe(0);
      expect(placements[1]!.playerIndex).toBe(1);
      expect(placements[2]!.playerIndex).toBe(2);
      expect(placements[3]!.playerIndex).toBe(3);

      expect(placements[0]!.position).toBe(1); // Expect player 1 to be on second place
      expect(placements[1]!.position).toBe(2); // Expect player 2 to be on third place
      expect(placements[2]!.position).toBe(0); // Expect player 3 to be first place
      expect(placements[3]!.position).toBe(-1); // Expect player 4 to not be present

      game = new SlippiGame("slp/placementsTest/ffa_1p2p4p_winner_4p.slp");
      placements = game.getGameEnd()?.placements!;
      expect(placements).toBeDefined();
      expect(placements).toHaveLength(4);

      expect(placements[0]!.playerIndex).toBe(0);
      expect(placements[1]!.playerIndex).toBe(1);
      expect(placements[2]!.playerIndex).toBe(2);
      expect(placements[3]!.playerIndex).toBe(3);

      expect(placements[0]!.position).toBe(1); // Expect player 1 to be on second place
      expect(placements[1]!.position).toBe(2); // Expect player 2 to be on third place
      expect(placements[2]!.position).toBe(-1); // Expect player 3 to not be present
      expect(placements[3]!.position).toBe(0); // Expect player 4 to be first place
    });
  });

  describe("when the game mode is Teams", () => {
    it("should return all winners", () => {
      const game = new SlippiGame("slp/placementsTest/teams_time_p3_redVSp1p2_blueVSp4_green_winner_blue.slp");
      const settings = game.getSettings()!;
      const winners = game.getWinners();
      expect(winners).toHaveLength(2);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(1);
      expect(settings.players[0]?.teamId).toBe(1);
      expect(winners[1]!.playerIndex).toBe(1);
      expect(winners[1]!.position).toBe(0);
      expect(settings.players[1]!.teamId).toBe(1);
    });

    it("should return the correct placings", () => {
      const game = new SlippiGame("slp/placementsTest/teams_p1p2_blueVSp4_green_winner_green.slp");
      const settings = game.getSettings()!;
      const placements = game.getGameEnd()?.placements!;
      expect(placements).toBeDefined();
      expect(placements).toHaveLength(4);

      expect(placements[0]!.playerIndex).toBe(0);
      expect(placements[1]!.playerIndex).toBe(1);
      expect(placements[2]!.playerIndex).toBe(2);
      expect(placements[3]!.playerIndex).toBe(3);

      expect(placements[0]!.position).toBe(1); // Expect player 1 to be on second place
      expect(placements[1]!.position).toBe(2); // Expect player 2 to be on third place
      expect(placements[2]!.position).toBe(-1); // Expect player 3 to not be present
      expect(placements[3]!.position).toBe(0); // Expect player 4 to be first place

      expect(settings.players[0]!.teamId).toBe(1); // Expect player 1 to be on team blue
      expect(settings.players[1]!.teamId).toBe(1); // Expect player 2 to be on team blue
      expect(settings.players[2]!.teamId).toBe(2); // Expect player 4 to be on team green
    });

    it("should return placings in timed mode", () => {
      // Based on scores (time), not stock
      const game = new SlippiGame("slp/placementsTest/teams_time_p3_redVSp1p2_blueVSp4_green_winner_blue.slp");
      const settings = game.getSettings()!;
      const placements = game.getGameEnd()?.placements!;
      expect(placements).toBeDefined();
      expect(placements).toHaveLength(4);

      expect(placements[0]!.playerIndex).toBe(0);
      expect(placements[1]!.playerIndex).toBe(1);
      expect(placements[2]!.playerIndex).toBe(2);
      expect(placements[3]!.playerIndex).toBe(3);

      expect(placements[0]!.position).toBe(1); // Expect player 1 to be on second place
      expect(placements[1]!.position).toBe(0); // Expect player 2 to be on first place
      expect(placements[2]!.position).toBe(3); // Expect player 3 to be on fourth place
      expect(placements[3]!.position).toBe(2); // Expect player 4 to be on third place

      expect(settings.players[0]!.teamId).toBe(1); // Expect player 1 to be on team blue
      expect(settings.players[1]!.teamId).toBe(1); // Expect player 2 to be on team blue
      expect(settings.players[2]!.teamId).toBe(0); // Expect player 3 to be on team red
      expect(settings.players[3]!.teamId).toBe(2); // Expect player 4 to be on team green
    });

    it("should return correct winners in timeout", () => {
      const game = new SlippiGame("slp/placementsTest/incorrect-winner-timeout.slp");
      const winners = game.getWinners();
      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(0);
    });
  });
});
