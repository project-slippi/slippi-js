import type { FrameEntryType, GameEndType, GameStartType, PlacementType, PostFrameUpdateType } from "../types";
import { GameEndMethod } from "../types";
import { exists } from "./exists";

export function getWinners(
  gameEnd: GameEndType,
  settings: Pick<GameStartType, "players" | "isTeams">,
  finalPostFrameUpdates: PostFrameUpdateType[],
  latestFrame: FrameEntryType | null,
): PlacementType[] {
  const { placements, gameEndMethod, lrasInitiatorIndex } = gameEnd;
  const { players, isTeams } = settings;

  if (gameEndMethod === GameEndMethod.NO_CONTEST || gameEndMethod === GameEndMethod.UNRESOLVED) {
    // The winner is the person who didn't LRAS
    if (exists(lrasInitiatorIndex) && players.length === 2) {
      const winnerIndex = players.find(({ playerIndex }) => playerIndex !== lrasInitiatorIndex)?.playerIndex;
      if (exists(winnerIndex)) {
        return [
          {
            playerIndex: winnerIndex,
            position: 0,
          },
        ];
      }
    }

    return [];
  }

  if (gameEndMethod === GameEndMethod.TIME && players.length === 2) {
    const nonFollowerUpdates = finalPostFrameUpdates.filter((pfu) => !pfu.isFollower);
    if (nonFollowerUpdates.length !== players.length) {
      return [];
    }

    const p1 = nonFollowerUpdates[0]!;
    const p2 = nonFollowerUpdates[1]!;
    if (p1.stocksRemaining! > p2.stocksRemaining!) {
      return [{ playerIndex: p1.playerIndex!, position: 0 }];
    } else if (p2.stocksRemaining! > p1.stocksRemaining!) {
      return [{ playerIndex: p2.playerIndex!, position: 0 }];
    }

    const p1Health = Math.trunc(p1.percent!);
    const p2Health = Math.trunc(p2.percent!);
    if (p1Health < p2Health) {
      return [{ playerIndex: p1.playerIndex!, position: 0 }];
    } else if (p2Health < p1Health) {
      return [{ playerIndex: p2.playerIndex!, position: 0 }];
    }

    // If stocks and percents were tied, no winner
    return [];
  }

  // should only be true for legacy slps with no placements (< 3.13.0) or games without gameEnd payload
  // should probably be expanded to include doubles/ffa but only works on signles for now
  if (
    latestFrame &&
    placements.every((placement) => placement.position === null) &&
    gameEndMethod === GameEndMethod.GAME
  ) {
    if (players.length === 2) {
      // not sure how safe the !s are here
      const p1Idx = players[0]?.playerIndex!;
      const p2Idx = players[1]?.playerIndex!;
      const p1Stocks = latestFrame.players[0]?.post.stocksRemaining;
      const p2Stocks = latestFrame.players[p2Idx]?.post.stocksRemaining;
      if (p2Stocks && p2Stocks === 0 && p1Stocks && p1Stocks > 0) {
        return [{ playerIndex: p1Idx, position: 0 }];
      } else if (p1Stocks && p1Stocks === 0 && p2Stocks && p2Stocks > 0) {
        return [{ playerIndex: p2Idx, position: 0 }];
      }
    }
  }

  const firstPosition = placements.find((placement) => placement.position === 0);
  if (!firstPosition) {
    return [];
  }

  const winningTeam = players.find(({ playerIndex }) => playerIndex === firstPosition.playerIndex)?.teamId ?? null;
  if (isTeams && exists(winningTeam)) {
    return placements.filter((placement) => {
      const teamId = players.find(({ playerIndex }) => playerIndex === placement.playerIndex)?.teamId ?? null;
      return teamId === winningTeam;
    });
  }

  return [firstPosition];
}
