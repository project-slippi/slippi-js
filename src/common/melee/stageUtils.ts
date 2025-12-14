import stagesInfoMap from "./stages.json";

type StageMode = "vs" | "target-test" | "home-run-contest";

export type StageInfo = {
  id: number;
  name: string;
  mode?: StageMode;
};

const ALL_STAGES = new Map<number, StageInfo>(
  Object.entries(stagesInfoMap).map(([key, value]) => {
    const stageId = parseInt(key);
    const info: StageInfo = {
      id: stageId,
      name: value.name,
      mode: value.mode as StageMode,
    };
    return [stageId, info];
  }),
);

export const UnknownStage: StageInfo = {
  id: -1,
  name: "Unknown Stage",
};

export function getStageInfo(stageId: number): StageInfo {
  const stageInfo = ALL_STAGES.get(stageId);
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

export function getStages(mode: "all" | StageMode = "vs"): StageInfo[] {
  return Array.from(ALL_STAGES.values()).filter((stage) => {
    return mode === "all" || stage.mode === mode;
  });
}
