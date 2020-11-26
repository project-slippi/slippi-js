import { Stage } from "./types";

export interface StageInfo {
  id: number;
  name: string;
}

const stages: { [id: number]: StageInfo } = {
  [Stage.FOUNTAIN_OF_DREAMS]: {
    id: Stage.FOUNTAIN_OF_DREAMS,
    name: "Fountain of Dreams",
  },
  [Stage.POKEMON_STADIUM]: {
    id: Stage.POKEMON_STADIUM,
    name: "Pokémon Stadium",
  },
  [Stage.PEACHS_CASTLE]: {
    id: Stage.PEACHS_CASTLE,
    name: "Princess Peach's Castle",
  },
  [Stage.KONGO_JUNGLE]: {
    id: Stage.KONGO_JUNGLE,
    name: "Kongo Jungle",
  },
  [Stage.BRINSTAR]: {
    id: Stage.BRINSTAR,
    name: "Brinstar",
  },
  [Stage.CORNERIA]: {
    id: Stage.CORNERIA,
    name: "Corneria",
  },
  [Stage.YOSHIS_STORY]: {
    id: Stage.YOSHIS_STORY,
    name: "Yoshi's Story",
  },
  [Stage.ONETT]: {
    id: Stage.ONETT,
    name: "Onett",
  },
  [Stage.MUTE_CITY]: {
    id: Stage.MUTE_CITY,
    name: "Mute City",
  },
  [Stage.RAINBOW_CRUISE]: {
    id: Stage.RAINBOW_CRUISE,
    name: "Rainbow Cruise",
  },
  [Stage.JUNGLE_JAPES]: {
    id: Stage.JUNGLE_JAPES,
    name: "Jungle Japes",
  },
  [Stage.GREAT_BAY]: {
    id: Stage.GREAT_BAY,
    name: "Great Bay",
  },
  [Stage.HYRULE_TEMPLE]: {
    id: Stage.HYRULE_TEMPLE,
    name: "Hyrule Temple",
  },
  [Stage.BRINSTAR_DEPTHS]: {
    id: Stage.BRINSTAR_DEPTHS,
    name: "Brinstar Depths",
  },
  [Stage.YOSHIS_ISLAND]: {
    id: Stage.YOSHIS_ISLAND,
    name: "Yoshi's Island",
  },
  [Stage.GREEN_GREENS]: {
    id: Stage.GREEN_GREENS,
    name: "Green Greens",
  },
  [Stage.FOURSIDE]: {
    id: Stage.FOURSIDE,
    name: "Fourside",
  },
  [Stage.MUSHROOM_KINGDOM]: {
    id: Stage.MUSHROOM_KINGDOM,
    name: "Mushroom Kingdom I",
  },
  [Stage.MUSHROOM_KINGDOM_2]: {
    id: Stage.MUSHROOM_KINGDOM_2,
    name: "Mushroom Kingdom II",
  },
  [Stage.VENOM]: {
    id: Stage.VENOM,
    name: "Venom",
  },
  [Stage.POKE_FLOATS]: {
    id: Stage.POKE_FLOATS,
    name: "Poké Floats",
  },
  [Stage.BIG_BLUE]: {
    id: Stage.BIG_BLUE,
    name: "Big Blue",
  },
  [Stage.ICICLE_MOUNTAIN]: {
    id: Stage.ICICLE_MOUNTAIN,
    name: "Icicle Mountain",
  },
  [Stage.ICETOP]: {
    id: Stage.ICETOP,
    name: "Icetop",
  },
  [Stage.FLAT_ZONE]: {
    id: Stage.FLAT_ZONE,
    name: "Flat Zone",
  },
  [Stage.DREAMLAND]: {
    id: Stage.DREAMLAND,
    name: "Dream Land N64",
  },
  [Stage.YOSHIS_ISLAND_N64]: {
    id: Stage.YOSHIS_ISLAND_N64,
    name: "Yoshi's Island N64",
  },
  [Stage.KONGO_JUNGLE_N64]: {
    id: Stage.KONGO_JUNGLE_N64,
    name: "Kongo Jungle N64",
  },
  [Stage.BATTLEFIELD]: {
    id: Stage.BATTLEFIELD,
    name: "Battlefield",
  },
  [Stage.FINAL_DESTINATION]: {
    id: Stage.FINAL_DESTINATION,
    name: "Final Destination",
  },
};

export function getStageInfo(stageId: number): StageInfo {
  const s = stages[stageId];
  if (!s) {
    throw new Error(`Invalid stage with id ${stageId}`);
  }
  return s;
}

export function getStageName(stageId: number): string {
  const stage = getStageInfo(stageId);
  return stage.name;
}
