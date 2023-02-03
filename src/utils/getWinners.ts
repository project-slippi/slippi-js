import type { GameEndType, GameStartType, PlacementType } from "../types";
import { GameEndMethod } from "../types";
import { exists } from "./exists";

export function getWinners(
  gameEnd: GameEndType,
  settings: Pick<GameStartType, "players" | "isTeams">,
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

  const firstPosition = placements.find((placement) => placement?.position === 0);
  if (!firstPosition) {
    return [];
  }

  if (isTeams) {
    const winningTeam = players.find(({ playerIndex }) => playerIndex === firstPosition.playerIndex)?.teamId;
    return placements.filter((placement) => {
      const teamId = players.find(({ playerIndex }) => playerIndex === placement.playerIndex)?.teamId;
      return teamId === winningTeam;
    });
  }

  return [firstPosition];
}
