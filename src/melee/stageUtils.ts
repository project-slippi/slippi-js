import stageNames from "./stages.json";

export type StageInfo = {
  id: number;
  name: string;
};

export const UnknownStage: StageInfo = {
  id: -1,
  name: "Unknown Stage",
};

type StageId = keyof typeof stageNames;

export function getStageInfo(stageId: number): StageInfo {
  const stageName = stageNames[stageId.toString() as StageId];
  if (!stageName) {
    return UnknownStage;
  }
  return {
    id: stageId,
    name: stageName,
  };
}

export function getStageName(stageId: number): string {
  const stage = getStageInfo(stageId);
  return stage.name;
}
