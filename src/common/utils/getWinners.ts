import type { GameEndType, GameStartType, PlacementType, PostFrameUpdateType } from "../types.js";
import { GameEndMethod } from "../types.js";
import { exists } from "./exists.js";

export function getWinners(
  gameEnd: Partial<GameEndType>,
  settings: Pick<GameStartType, "players" | "isTeams">,
  finalPostFrameUpdates: PostFrameUpdateType[],
): PlacementType[] {
  const { placements, gameEndMethod, lrasInitiatorIndex } = gameEnd;
  const { players, isTeams } = settings;

  if (gameEndMethod === GameEndMethod.NO_CONTEST || gameEndMethod === GameEndMethod.UNRESOLVED) {
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

  const nonFollowerUpdates = finalPostFrameUpdates.filter((pfu) => !pfu.isFollower);

  if (nonFollowerUpdates.every((pfu) => pfu.stocksRemaining === 0)) {
    return [];
  }

  const useLastFrameFallback = !gameEndMethod && nonFollowerUpdates.length >= 2 && players.length >= 2;

  if (
    useLastFrameFallback ||
    (gameEndMethod === GameEndMethod.TIME && players.length >= 2 && nonFollowerUpdates.length >= 2)
  ) {
    if (isTeams) {
      const teamAggregates: Map<number, { totalStocks: number; totalPercent: number; players: PostFrameUpdateType[] }> =
        new Map();

      for (const pfu of nonFollowerUpdates) {
        const player = players.find((p) => p.playerIndex === pfu.playerIndex);
        if (!player) {
          continue;
        }

        const teamId = player.teamId ?? -1;
        const existing = teamAggregates.get(teamId) ?? {
          totalStocks: 0,
          totalPercent: 0,
          players: [],
        };

        teamAggregates.set(teamId, {
          totalStocks: existing.totalStocks + (pfu.stocksRemaining ?? 0),
          totalPercent: existing.totalPercent + (pfu.percent ?? 0),
          players: [...existing.players, pfu],
        });
      }

      if (teamAggregates.size === 0) {
        return [];
      }

      const sortedTeams = [...teamAggregates.values()].sort((a, b) => {
        if (b.totalStocks !== a.totalStocks) {
          return b.totalStocks - a.totalStocks;
        }
        return a.totalPercent - b.totalPercent;
      });

      const winningTeamPlayers = sortedTeams[0]!.players;

      const sortedByPerformance = [...winningTeamPlayers].sort((a, b) => {
        if ((b.stocksRemaining ?? 0) !== (a.stocksRemaining ?? 0)) {
          return (b.stocksRemaining ?? 0) - (a.stocksRemaining ?? 0);
        }
        return (a.percent ?? 0) - (b.percent ?? 0);
      });

      const positionMap = new Map(sortedByPerformance.map((p, idx) => [p.playerIndex, idx]));

      const sortedByPlayerIndex = [...winningTeamPlayers].sort((a, b) => (a.playerIndex ?? 0) - (b.playerIndex ?? 0));

      return sortedByPlayerIndex.map((pfu) => ({
        playerIndex: pfu.playerIndex!,
        position: positionMap.get(pfu.playerIndex) ?? 0,
      }));
    }

    const ranked = [...nonFollowerUpdates].sort((a, b) => {
      if ((b.stocksRemaining ?? 0) !== (a.stocksRemaining ?? 0)) {
        return (b.stocksRemaining ?? 0) - (a.stocksRemaining ?? 0);
      }
      return (a.percent ?? 0) - (b.percent ?? 0);
    });

    const winnerStocks = ranked[0]!.stocksRemaining;
    const winnerPercent = ranked[0]!.percent;
    const winners = ranked.filter((p) => p.stocksRemaining === winnerStocks && p.percent === winnerPercent);

    return winners.map((pfu) => ({
      playerIndex: pfu.playerIndex!,
      position: 0,
    }));
  }

  if (placements && placements.length > 0) {
    const firstPosition = placements.find((placement) => placement.position === 0);
    if (!firstPosition) {
      return [];
    }

    const winningTeam = players.find(({ playerIndex }) => playerIndex === firstPosition.playerIndex)?.teamId;
    if (isTeams && exists(winningTeam)) {
      return placements.filter((placement) => {
        const teamId = players.find(({ playerIndex }) => playerIndex === placement.playerIndex)?.teamId;
        return teamId === winningTeam;
      });
    }

    return [firstPosition];
  }

  return [];
}
