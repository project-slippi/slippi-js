import { Stage } from "./types";

export interface StageInfo {
  id: number;
  name: string;
}

export const UnknownStage: StageInfo = {
  id: -1,
  name: "Unknown Stage",
};

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
  [Stage.TARGET_TEST_MARIO]: {
    id: Stage.TARGET_TEST_MARIO,
    name: "Target Test (Mario)",
  },
  [Stage.TARGET_TEST_CAPTAIN_FALCON]: {
    id: Stage.TARGET_TEST_CAPTAIN_FALCON,
    name: "Target Test (Captain Falcon)",
  },
  [Stage.TARGET_TEST_YOUNG_LINK]: {
    id: Stage.TARGET_TEST_YOUNG_LINK,
    name: "Target Test (Young Link)",
  },
  [Stage.TARGET_TEST_DONKEY_KONG]: {
    id: Stage.TARGET_TEST_DONKEY_KONG,
    name: "Target Test (Donkey Kong)",
  },
  [Stage.TARGET_TEST_DR_MARIO]: {
    id: Stage.TARGET_TEST_DR_MARIO,
    name: "Target Test (Dr. Mario)",
  },
  [Stage.TARGET_TEST_FALCO]: {
    id: Stage.TARGET_TEST_FALCO,
    name: "Target Test (Falco)",
  },
  [Stage.TARGET_TEST_FOX]: {
    id: Stage.TARGET_TEST_FOX,
    name: "Target Test (Fox)",
  },
  [Stage.TARGET_TEST_ICE_CLIMBERS]: {
    id: Stage.TARGET_TEST_ICE_CLIMBERS,
    name: "Target Test (Ice Climbers)",
  },
  [Stage.TARGET_TEST_KIRBY]: {
    id: Stage.TARGET_TEST_KIRBY,
    name: "Target Test (Kirby)",
  },
  [Stage.TARGET_TEST_BOWSER]: {
    id: Stage.TARGET_TEST_BOWSER,
    name: "Target Test (Bowser)",
  },
  [Stage.TARGET_TEST_LINK]: {
    id: Stage.TARGET_TEST_LINK,
    name: "Target Test (Link)",
  },
  [Stage.TARGET_TEST_LUIGI]: {
    id: Stage.TARGET_TEST_LUIGI,
    name: "Target Test (Luigi)",
  },
  [Stage.TARGET_TEST_MARTH]: {
    id: Stage.TARGET_TEST_MARTH,
    name: "Target Test (Marth)",
  },
  [Stage.TARGET_TEST_MEWTWO]: {
    id: Stage.TARGET_TEST_MEWTWO,
    name: "Target Test (Mewtwo)",
  },
  [Stage.TARGET_TEST_NESS]: {
    id: Stage.TARGET_TEST_NESS,
    name: "Target Test (Ness)",
  },
  [Stage.TARGET_TEST_PEACH]: {
    id: Stage.TARGET_TEST_PEACH,
    name: "Target Test (Peach)",
  },
  [Stage.TARGET_TEST_PICHU]: {
    id: Stage.TARGET_TEST_PICHU,
    name: "Target Test (Pichu)",
  },
  [Stage.TARGET_TEST_PIKACHU]: {
    id: Stage.TARGET_TEST_PIKACHU,
    name: "Target Test (Pikachu)",
  },
  [Stage.TARGET_TEST_JIGGLYPUFF]: {
    id: Stage.TARGET_TEST_JIGGLYPUFF,
    name: "Target Test (Jigglypuff)",
  },
  [Stage.TARGET_TEST_SAMUS]: {
    id: Stage.TARGET_TEST_SAMUS,
    name: "Target Test (Samus)",
  },
  [Stage.TARGET_TEST_SHEIK]: {
    id: Stage.TARGET_TEST_SHEIK,
    name: "Target Test (Sheik)",
  },
  [Stage.TARGET_TEST_YOSHI]: {
    id: Stage.TARGET_TEST_YOSHI,
    name: "Target Test (Yoshi)",
  },
  [Stage.TARGET_TEST_ZELDA]: {
    id: Stage.TARGET_TEST_ZELDA,
    name: "Target Test (Zelda)",
  },
  [Stage.TARGET_TEST_GAME_AND_WATCH]: {
    id: Stage.TARGET_TEST_GAME_AND_WATCH,
    name: "Target Test (Mr. Game & Watch)",
  },
  [Stage.TARGET_TEST_ROY]: {
    id: Stage.TARGET_TEST_ROY,
    name: "Target Test (Roy)",
  },
  [Stage.TARGET_TEST_GANONDORF]: {
    id: Stage.TARGET_TEST_GANONDORF,
    name: "Target Test (Ganondorf)",
  },
  [Stage.HOME_RUN_CONTEST]: {
    id: Stage.HOME_RUN_CONTEST,
    name: "Home-Run Contest",
  },
};

export function getStageInfo(stageId: number): StageInfo {
  const s = stages[stageId];
  if (!s) {
    return UnknownStage;
  }
  return s;
}

export function getStageName(stageId: number): string {
  const stage = getStageInfo(stageId);
  return stage.name;
}
