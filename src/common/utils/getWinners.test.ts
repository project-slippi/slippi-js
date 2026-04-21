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
  it("should return correct winners when gameEnd is empty (no gameEnd block)", () => {
    const game = new SlippiGame("slp/placementsTest/ffa_1p2p_winner_2p.slp");
    const settings = game.getSettings()!;
    const finalPostFrameUpdates = getLastFrameUpdates(game);

    const gameEnd = {};
    const winners = getWinners(gameEnd as Partial<GameEndType>, settings, finalPostFrameUpdates);

    expect(winners).toHaveLength(1);
    expect(winners[0]!.playerIndex).toBe(1);
    expect(winners[0]!.position).toBe(0);
  });

  it("should return no winners when both players have 0 stocks (double KO)", () => {
    const game = new SlippiGame("slp/placementsTest/same-frame-death.slp");
    const settings = game.getSettings()!;
    const finalPostFrameUpdates = getLastFrameUpdates(game);

    const gameEnd = {};
    const winners = getWinners(gameEnd as Partial<GameEndType>, settings, finalPostFrameUpdates);

    expect(winners).toHaveLength(0);
  });

  it("should return correct winners in timeout when gameEnd is empty", () => {
    const game = new SlippiGame("slp/placementsTest/incorrect-winner-timeout.slp");
    const settings = game.getSettings()!;
    const finalPostFrameUpdates = getLastFrameUpdates(game);

    const gameEnd = {};
    const winners = getWinners(gameEnd as Partial<GameEndType>, settings, finalPostFrameUpdates);

    expect(winners).toHaveLength(1);
    expect(winners[0]!.playerIndex).toBe(0);
  });
});
