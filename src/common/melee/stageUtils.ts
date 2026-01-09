import stagesInfoMap from "./stages.json";

type StageMode = "vs" | "target-test" | "home-run-contest";

export type StageInfo = {
  id: number;
  name: string;
  mode?: StageMode;
  aliases: string[];
};

const ALL_STAGES = new Map<number, StageInfo>(
  Object.entries(stagesInfoMap).map(([key, value]: [string, { name: string; mode: string; aliases?: string[] }]) => {
    const stageId = parseInt(key);
    const info: StageInfo = {
      id: stageId,
      name: value.name,
      aliases: value.aliases ?? [],
      mode: value.mode as StageMode,
    };
    return [stageId, info];
  }),
);

export const UnknownStage: StageInfo = {
  id: -1,
  name: "Unknown Stage",
  aliases: [],
};

export function getStageInfo(stageId: number): StageInfo {
  const stageInfo = ALL_STAGES.get(stageId);
  if (!stageInfo) {
    return UnknownStage;
  }
  return stageInfo;
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
