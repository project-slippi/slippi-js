import type { GameEndType, GameStartType, PlacementType, PostFrameUpdateType } from "../types";
import { GameEndMethod } from "../types";
import { exists } from "./exists";

export function getWinners(
  gameEnd: GameEndType,
  settings: Pick<GameStartType, "players" | "isTeams">,
  finalPostFrameUpdates: PostFrameUpdateType[],
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
