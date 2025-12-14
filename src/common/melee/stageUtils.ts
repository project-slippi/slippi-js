import stagesInfoMap from "./stages.json";

export type StageInfo = {
  id: number;
  name: string;
};

export const UnknownStage: StageInfo = {
  id: -1,
  name: "Unknown Stage",
};

type StageId = keyof typeof stagesInfoMap;

export function getStageInfo(stageId: number): StageInfo {
  const stageInfo = stagesInfoMap[stageId.toString() as StageId];
  if (!stageInfo) {
    return UnknownStage;
  }
  return {
    id: stageId,
    name: stageInfo.name,
  };
}

export function getStageName(stageId: number): string {
  const stage = getStageInfo(stageId);
  return stage.name;
}
