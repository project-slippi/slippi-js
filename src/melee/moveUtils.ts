import moveNames from "./moves.json";

export type Move = {
  id: number;
  name: string;
  shortName: string;
};

export const UnknownMove: Move = {
  id: -1,
  name: "Unknown Move",
  shortName: "unknown",
};

type MoveId = keyof typeof moveNames;

export function getMoveInfo(moveId: number): Move {
  const moveName = moveNames[moveId.toString() as MoveId];
  if (!moveName) {
    return UnknownMove;
  }
  return {
    id: moveId,
    name: moveName.name,
    shortName: moveName.shortName,
  };
}

export function getMoveShortName(moveId: number): string {
  const move = getMoveInfo(moveId);
  return move.shortName;
}

export function getMoveName(moveId: number): string {
  const move = getMoveInfo(moveId);
  return move.name;
}
