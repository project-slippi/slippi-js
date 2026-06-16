import type { GameEndType, GameStartType, PlacementType, PostFrameUpdateType } from "../types.js";
import { GameEndMethod } from "../types.js";
import { exists } from "./exists.js";

type TeamAggregate = {
  totalStocks: number;
  totalPercent: number;
  players: PostFrameUpdateType[];
};

export type GetWinnersOptions = {
  ledgeGrabLimit?: number;
  ledgeGrabCounts?: Record<number, number>;
};

export function getWinners(
  gameEnd: Partial<GameEndType>,
  settings: Pick<GameStartType, "players" | "isTeams">,
  finalPostFrameUpdates: PostFrameUpdateType[],
  options?: GetWinnersOptions,
): PlacementType[] {
  const { placements, gameEndMethod, lrasInitiatorIndex } = gameEnd;
  const { players, isTeams } = settings;

  // ==========================================================================
  // LRAS / Unresolved (NO_CONTEST or UNRESOLVED)
  // ==========================================================================
  // When a game ends via LRAS (Large Render Area Start) or is unresolved,
  // the winner is simply the player who did NOT initiate the LRAS.
  // Only applies to 2-player games.
  if (gameEndMethod === GameEndMethod.NO_CONTEST || gameEndMethod === GameEndMethod.UNRESOLVED) {
    if (exists(lrasInitiatorIndex) && players.length === 2) {
      const winnerIndex = players.find(({ playerIndex }) => playerIndex !== lrasInitiatorIndex)?.playerIndex;
      if (exists(winnerIndex)) {
        return [{ playerIndex: winnerIndex, position: 0 }];
      }
    }
    return [];
  }

  // Filter out followers (Nana)
  const activePlayers = finalPostFrameUpdates.filter((pfu) => !pfu.isFollower);

  // ==========================================================================
  // Double KO (all players have 0 stocks)
  // ==========================================================================
  // If everyone died at the same time (both players have 0 stocks remaining),
  // there is no winner - this is a draw.
  if (activePlayers.every((pfu) => pfu.stocksRemaining === 0)) {
    return [];
  }

  // ==========================================================================
  // Use last frame data to determine winners (fallback)
  // ==========================================================================
  // This path is used when:
  // - No gameEnd block exists (gameEndMethod is undefined/null), OR
  // - Game ended via TIME (timeout) with 2+ players
  //
  // Winner determination from last frame:
  // - More stocks remaining = better (wins)
  // - If tied on stocks, lower percent = better (wins)
  // - If completely tied, no winner (draw)
  //
  // For Teams: The winning team is determined by total combined stocks/percent,
  // then all players on that team are returned as winners.

  // We should determine winners from last frame if:
  // - No gameEndMethod exists (file lacks gameEnd block), OR
  // - Game ended via TIME (timeout)
  // - AND we have at least 2 players with frame data
  const shouldDetermineFromLastFrame =
    (!gameEndMethod || gameEndMethod === GameEndMethod.TIME) && activePlayers.length >= 2;

  if (shouldDetermineFromLastFrame) {
    if (isTeams) {
      return getTeamsWinners(players, activePlayers);
    }
    const winners = getFFAWinners(activePlayers);
    return applyLedgeGrabLimit(winners, players, gameEndMethod, options);
  }

  // ==========================================================================
  // Use placements from gameEnd block
  // ==========================================================================
  // If the game has a valid gameEnd block with placements, use those.
  // This is the preferred path when gameEnd data is available.
  // - For FFA: Return the player(s) with position 0
  // - For Teams: Return all players on the winning team

  if (placements && placements.length > 0) {
    const firstPlace = placements.find((p) => p.position === 0);
    if (!firstPlace) {
      return [];
    }

    // For teams, return all players on the winning team
    if (isTeams) {
      const winningTeamId = players.find((p) => p.playerIndex === firstPlace.playerIndex)?.teamId;
      if (exists(winningTeamId)) {
        return placements.filter((p) => {
          const playerTeamId = players.find((pl) => pl.playerIndex === p.playerIndex)?.teamId;
          return playerTeamId === winningTeamId;
        });
      }
    }

    return [firstPlace];
  }

  // ==========================================================================
  // No determinable winner
  // ==========================================================================
  // Unable to determine winners from any available data
  return [];
}

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Determines winners for Free-For-All (non-teams) games using last frame data.
 *
 * Ranking algorithm:
 * 1. Sort by stocks remaining (descending) - more stocks = higher rank
 * 2. If tied on stocks, sort by percent (ascending) - lower percent = higher rank
 *
 * Winners are players that are tied for first place (same stocks AND same percent).
 * Returns players sorted by playerIndex (port order).
 */
function getFFAWinners(activePlayers: PostFrameUpdateType[]): PlacementType[] {
  // Sort all players by performance (stocks desc, percent asc)
  const sortedByPerformance = sortByPerformance(activePlayers);

  // Find the top player's stats to determine ties
  const topStocks = sortedByPerformance[0]!.stocksRemaining;
  const topPercent = sortedByPerformance[0]!.percent;

  // Winners are anyone tied with the top player (same stocks AND same percent)
  const winners = sortedByPerformance.filter((p) => p.stocksRemaining === topStocks && p.percent === topPercent);

  // Return in playerIndex (port) order, all with position 0
  return winners
    .sort((a, b) => (a.playerIndex ?? 0) - (b.playerIndex ?? 0))
    .map((p) => ({ playerIndex: p.playerIndex!, position: 0 }));
}

/**
 * Determines winners for Teams games using last frame data.
 *
 * Team ranking algorithm:
 * 1. Sum stocks for each team - team with more stocks = higher rank
 * 2. If tied on stocks, sum percent for each team - team with lower percent = higher rank
 *
 * Returns all players on the winning team, with positions based on individual
 * performance within that team.
 */
function getTeamsWinners(gamePlayers: GameStartType["players"], activePlayers: PostFrameUpdateType[]): PlacementType[] {
  // Aggregate stats by team
  const teamAggregates = aggregateTeams(gamePlayers, activePlayers);

  if (teamAggregates.size === 0) {
    return [];
  }

  // Sort teams by performance (stocks desc, percent asc)
  const sortedTeams = [...teamAggregates.values()].sort((a, b) => {
    const stocksDiff = b.totalStocks - a.totalStocks;
    if (stocksDiff !== 0) {
      return stocksDiff;
    }
    return a.totalPercent - b.totalPercent;
  });

  // Get all players on the winning team
  const winningTeamPlayers = sortedTeams[0]!.players;

  // Sort winning team players by individual performance to determine positions
  const sortedByPerformance = sortByPerformance(winningTeamPlayers);

  // Create a map from playerIndex to their position (rank) on the team
  const positionMap = new Map(sortedByPerformance.map((p, idx) => [p.playerIndex, idx]));

  // Return players in playerIndex (port) order, with their team position
  return winningTeamPlayers
    .sort((a, b) => (a.playerIndex ?? 0) - (b.playerIndex ?? 0))
    .map((p) => ({
      playerIndex: p.playerIndex!,
      position: positionMap.get(p.playerIndex) ?? 0,
    }));
}

/**
 * Aggregates player stats by team ID.
 * Returns a Map where keys are team IDs and values are aggregate stats
 * (totalStocks, totalPercent) plus the list of players on each team.
 */
function aggregateTeams(
  gamePlayers: GameStartType["players"],
  activePlayers: PostFrameUpdateType[],
): Map<number, TeamAggregate> {
  const teamAggregates = new Map<number, TeamAggregate>();

  for (const pfu of activePlayers) {
    const player = gamePlayers.find((p) => p.playerIndex === pfu.playerIndex);
    if (!player) {
      continue;
    }

    // Use -1 as default teamId for players without a team (shouldn't happen in teams mode)
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

  return teamAggregates;
}

/**
 * Sorts players by performance (stocks remaining desc, percent asc).
 * Used to rank players for winner determination.
 */
function sortByPerformance(players: PostFrameUpdateType[]): PostFrameUpdateType[] {
  return [...players].sort((a, b) => {
    const stocksDiff = (b.stocksRemaining ?? 0) - (a.stocksRemaining ?? 0);
    if (stocksDiff !== 0) {
      return stocksDiff;
    }
    return (a.percent ?? 0) - (b.percent ?? 0);
  });
}

function applyLedgeGrabLimit(
  winners: PlacementType[],
  players: GameStartType["players"],
  gameEndMethod: GameEndMethod | undefined,
  options?: GetWinnersOptions,
): PlacementType[] {
  if (gameEndMethod !== GameEndMethod.TIME) {
    return winners;
  }

  if (players.length !== 2) {
    return winners;
  }

  const { ledgeGrabLimit, ledgeGrabCounts } = options ?? {};
  if (!ledgeGrabLimit || ledgeGrabLimit <= 0 || !ledgeGrabCounts) {
    return winners;
  }

  if (winners.length === 0) {
    return winners;
  }

  // Check if any winner exceeded the limit
  const winnersExceeding = winners.filter((w) => (ledgeGrabCounts[w.playerIndex] ?? 0) > ledgeGrabLimit);

  if (winnersExceeding.length === 0) {
    return winners;
  }

  // If all players exceeded the limit, it's a draw
  const allPlayersExceed = players.every((p) => (ledgeGrabCounts[p.playerIndex] ?? 0) > ledgeGrabLimit);

  if (allPlayersExceed) {
    return [];
  }

  // At least one non-exceeding player exists - they win
  const nonExceedingPlayers = players.filter((p) => (ledgeGrabCounts[p.playerIndex] ?? 0) <= ledgeGrabLimit);

  return nonExceedingPlayers.map((p) => ({
    playerIndex: p.playerIndex,
    position: 0,
  }));
}
