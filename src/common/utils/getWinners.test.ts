import { SlippiGame } from "../../node/index";
import type { FramesType, GameEndType, GameStartType, PostFrameUpdateType } from "../types";
import { GameEndMethod } from "../types";
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

  describe("ledge grab limit", () => {
    const baseSettings = {
      players: [
        { playerIndex: 0 } as GameStartType["players"][number],
        { playerIndex: 1 } as GameStartType["players"][number],
      ],
      isTeams: false,
    };

    const basePostFrameUpdates = [
      { playerIndex: 0, stocksRemaining: 2, percent: 50, isFollower: false },
      { playerIndex: 1, stocksRemaining: 1, percent: 100, isFollower: false },
    ] as PostFrameUpdateType[];

    it("should disqualify a player who exceeds the ledge grab limit in a timeout 1v1", () => {
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      const winners = getWinners(gameEnd, baseSettings, basePostFrameUpdates, {
        ledgeGrabLimit: 5,
        ledgeGrabCounts: { 0: 8, 1: 2 },
      });

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(1);
      expect(winners[0]!.position).toBe(0);
    });

    it("should disregard the rule when both players exceed the ledge grab limit and return original winners", () => {
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      const winners = getWinners(gameEnd, baseSettings, basePostFrameUpdates, {
        ledgeGrabLimit: 5,
        ledgeGrabCounts: { 0: 8, 1: 6 },
      });

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(0);
    });

    it("should return normal winner when neither player exceeds the limit", () => {
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      const winners = getWinners(gameEnd, baseSettings, basePostFrameUpdates, {
        ledgeGrabLimit: 10,
        ledgeGrabCounts: { 0: 3, 1: 5 },
      });

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(0);
    });

    it("should not apply the ledge grab limit when game did not end by time", () => {
      const gameEnd: Partial<GameEndType> = {
        gameEndMethod: GameEndMethod.GAME,
        placements: [{ playerIndex: 0, position: 0 }],
      };
      const winners = getWinners(gameEnd, baseSettings, basePostFrameUpdates, {
        ledgeGrabLimit: 5,
        ledgeGrabCounts: { 0: 8, 1: 2 },
      });

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(0);
    });

    it("should disqualify a team when a player on it exceeds the limit", () => {
      const teamsSettings = {
        players: [
          { playerIndex: 0, teamId: 0 } as GameStartType["players"][number],
          { playerIndex: 1, teamId: 0 } as GameStartType["players"][number],
          { playerIndex: 2, teamId: 1 } as GameStartType["players"][number],
          { playerIndex: 3, teamId: 1 } as GameStartType["players"][number],
        ],
        isTeams: true,
      };
      const teamsPostFrameUpdates = [
        { playerIndex: 0, stocksRemaining: 2, percent: 0, isFollower: false },
        { playerIndex: 1, stocksRemaining: 2, percent: 0, isFollower: false },
        { playerIndex: 2, stocksRemaining: 1, percent: 0, isFollower: false },
        { playerIndex: 3, stocksRemaining: 1, percent: 0, isFollower: false },
      ] as PostFrameUpdateType[];
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      // Team 0 (players 0,1) wins on stocks, but player 0 exceeds limit
      const winners = getWinners(gameEnd, teamsSettings, teamsPostFrameUpdates, {
        ledgeGrabLimit: 5,
        ledgeGrabCounts: { 0: 8, 1: 2, 2: 1, 3: 3 },
      });

      // Team 1 (players 2,3) should win
      expect(winners).toHaveLength(2);
      expect(winners[0]!.playerIndex).toBe(2);
      expect(winners[0]!.position).toBe(0);
      expect(winners[1]!.playerIndex).toBe(3);
      expect(winners[1]!.position).toBe(0);
    });

    it("should disregard the rule when both teams have a player that exceeds the limit", () => {
      const teamsSettings = {
        players: [
          { playerIndex: 0, teamId: 0 } as GameStartType["players"][number],
          { playerIndex: 1, teamId: 0 } as GameStartType["players"][number],
          { playerIndex: 2, teamId: 1 } as GameStartType["players"][number],
          { playerIndex: 3, teamId: 1 } as GameStartType["players"][number],
        ],
        isTeams: true,
      };
      const teamsPostFrameUpdates = [
        { playerIndex: 0, stocksRemaining: 2, percent: 0, isFollower: false },
        { playerIndex: 1, stocksRemaining: 2, percent: 0, isFollower: false },
        { playerIndex: 2, stocksRemaining: 1, percent: 0, isFollower: false },
        { playerIndex: 3, stocksRemaining: 1, percent: 0, isFollower: false },
      ] as PostFrameUpdateType[];
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      // Both teams have at least one exceeding player
      const winners = getWinners(gameEnd, teamsSettings, teamsPostFrameUpdates, {
        ledgeGrabLimit: 5,
        ledgeGrabCounts: { 0: 8, 1: 2, 2: 6, 3: 3 },
      });

      // Disregard → original stock/percent winners (Team 0)
      expect(winners).toHaveLength(2);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[1]!.playerIndex).toBe(1);
    });

    it("should disregard the rule when no team has a player that exceeds the limit", () => {
      const teamsSettings = {
        players: [
          { playerIndex: 0, teamId: 0 } as GameStartType["players"][number],
          { playerIndex: 1, teamId: 0 } as GameStartType["players"][number],
          { playerIndex: 2, teamId: 1 } as GameStartType["players"][number],
          { playerIndex: 3, teamId: 1 } as GameStartType["players"][number],
        ],
        isTeams: true,
      };
      const teamsPostFrameUpdates = [
        { playerIndex: 0, stocksRemaining: 2, percent: 0, isFollower: false },
        { playerIndex: 1, stocksRemaining: 2, percent: 0, isFollower: false },
        { playerIndex: 2, stocksRemaining: 1, percent: 0, isFollower: false },
        { playerIndex: 3, stocksRemaining: 1, percent: 0, isFollower: false },
      ] as PostFrameUpdateType[];
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      // No one exceeds
      const winners = getWinners(gameEnd, teamsSettings, teamsPostFrameUpdates, {
        ledgeGrabLimit: 5,
        ledgeGrabCounts: { 0: 2, 1: 3, 2: 1, 3: 4 },
      });

      // Disregard → original stock/percent winners (Team 0)
      expect(winners).toHaveLength(2);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[1]!.playerIndex).toBe(1);
    });

    it("should treat limit of 0 as no limit", () => {
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      const winners = getWinners(gameEnd, baseSettings, basePostFrameUpdates, {
        ledgeGrabLimit: 0,
        ledgeGrabCounts: { 0: 8, 1: 2 },
      });

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(0);
    });

    it("should treat negative limit as no limit", () => {
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      const winners = getWinners(gameEnd, baseSettings, basePostFrameUpdates, {
        ledgeGrabLimit: -1,
        ledgeGrabCounts: { 0: 8, 1: 2 },
      });

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(0);
    });

    it("should not affect result when no ledgeGrabCounts are provided", () => {
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      const winners = getWinners(gameEnd, baseSettings, basePostFrameUpdates, {
        ledgeGrabLimit: 5,
      });

      expect(winners).toHaveLength(1);
      expect(winners[0]!.playerIndex).toBe(0);
      expect(winners[0]!.position).toBe(0);
    });

    it("should not affect result when there are more than 2 players", () => {
      const ffaSettings = {
        players: [
          { playerIndex: 0 } as GameStartType["players"][number],
          { playerIndex: 1 } as GameStartType["players"][number],
          { playerIndex: 2 } as GameStartType["players"][number],
        ],
        isTeams: false,
      };
      const ffaPostFrameUpdates = [
        { playerIndex: 0, stocksRemaining: 1, percent: 0, isFollower: false },
        { playerIndex: 1, stocksRemaining: 1, percent: 0, isFollower: false },
        { playerIndex: 2, stocksRemaining: 1, percent: 0, isFollower: false },
      ] as PostFrameUpdateType[];
      const gameEnd: Partial<GameEndType> = { gameEndMethod: GameEndMethod.TIME };
      const winners = getWinners(gameEnd, ffaSettings, ffaPostFrameUpdates, {
        ledgeGrabLimit: 5,
        ledgeGrabCounts: { 0: 8, 1: 2, 2: 1 },
      });

      expect(winners).toHaveLength(3);
    });
  });
});
