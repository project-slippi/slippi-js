import { SlippiGame } from "../../node/index";
import type { FramesType, GameEndType, PostFrameUpdateType } from "../types";
import { getWinners } from "./getWinners";

function getLastFrameUpdates(game: SlippiGame): PostFrameUpdateType[] {
  const frames = game.getFrames() as FramesType;
  const lastFrameIndex = Math.max(...Object.keys(frames).map(Number));
  const lastFrame = frames[lastFrameIndex];
  if (!lastFrame?.players) {
    return [];
  }
  const updates: PostFrameUpdateType[] = [];
  for (const entry of Object.values(lastFrame.players)) {
    if (entry?.post && !entry.post.isFollower) {
      updates.push(entry.post);
    }
  }
  return updates;
}

describe("getWinners", () => {
  describe("when no gameEnd block is passed", () => {
    it("should return no winners when both players have 0 stocks (double KO)", () => {
      const game = new SlippiGame("slp/placementsTest/same-frame-death.slp");
      const settings = game.getSettings()!;
      const finalPostFrameUpdates = getLastFrameUpdates(game);

      const gameEnd = {};
      const winners = getWinners(gameEnd as Partial<GameEndType>, settings, finalPostFrameUpdates);

      expect(winners).toHaveLength(0);
    });

    it("should return correct winners in timeout", () => {
      const game = new SlippiGame("slp/placementsTest/incorrect-winner-timeout.slp");
      const settings = game.getSettings()!;
      const finalPostFrameUpdates = getLastFrameUpdates(game);

      const gameEnd = {};
      const winners = getWinners(gameEnd as Partial<GameEndType>, settings, finalPostFrameUpdates);

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(0);
    });

    it("should return correct winner in FFA mode", () => {
      const game = new SlippiGame("slp/placementsTest/ffa_1p2p_winner_2p.slp");
      const settings = game.getSettings()!;
      const finalPostFrameUpdates = getLastFrameUpdates(game);

      const gameEnd = {};
      const winners = getWinners(gameEnd as Partial<GameEndType>, settings, finalPostFrameUpdates);

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(1);
      expect(winners[0]!.position).toBe(0);
    });

    it("should return all winners in Teams mode", () => {
      const game = new SlippiGame("slp/placementsTest/teams_time_p3_redVSp1p2_blueVSp4_green_winner_blue.slp");
      const settings = game.getSettings()!;
      const finalPostFrameUpdates = getLastFrameUpdates(game);

      const gameEnd = {};
      const winners = getWinners(gameEnd as Partial<GameEndType>, settings, finalPostFrameUpdates);

      expect(winners).toHaveLength(2);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(1);
      expect(winners[1]!.playerIndex).toBe(1);
      expect(winners[1]!.position).toBe(0);
    });

    it("should return correct winner in FFA 3 player mode - winner p3", () => {
      const game = new SlippiGame("slp/placementsTest/ffa_1p2p3p_winner_3p.slp");
      const settings = game.getSettings()!;
      const finalPostFrameUpdates = getLastFrameUpdates(game);

      const gameEnd = {};
      const winners = getWinners(gameEnd as Partial<GameEndType>, settings, finalPostFrameUpdates);

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(2);
      expect(winners[0]!.position).toBe(0);
    });

    it("should return correct winner in FFA 3 player mode - winner p4", () => {
      const game = new SlippiGame("slp/placementsTest/ffa_1p2p4p_winner_4p.slp");
      const settings = game.getSettings()!;
      const finalPostFrameUpdates = getLastFrameUpdates(game);

      const gameEnd = {};
      const winners = getWinners(gameEnd as Partial<GameEndType>, settings, finalPostFrameUpdates);

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(3);
      expect(winners[0]!.position).toBe(0);
    });
  });
});
