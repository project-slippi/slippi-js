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
  [Stage.RACE_TO_THE_FINISH]: {
    id: Stage.RACE_TO_THE_FINISH,
    name: "Race to the Finish",
  },
  [Stage.GRAB_THE_TROPHIES]: {
    id: Stage.GRAB_THE_TROPHIES,
    name: "Grab the Trophies",
  },
  [Stage.HOME_RUN_CONTEST]: {
    id: Stage.HOME_RUN_CONTEST,
    name: "Home-Run Contest",
  },
  [Stage.ALL_STAR_LOBBY]: {
    id: Stage.ALL_STAR_LOBBY,
    name: "All-Star Lobby",
  },
  [Stage.EVENT_ONE]: {
    id: Stage.EVENT_ONE,
    name: "Battlefield (Event #1)",
  },
  [Stage.EVENT_TWO]: {
    id: Stage.EVENT_TWO,
    name: "Kongo Jungle (Event #2)",
  },
  [Stage.EVENT_THREE]: {
    id: Stage.EVENT_THREE,
    name: "Princess Peach's Castle (Event #3)",
  },
  [Stage.EVENT_FOUR]: {
    id: Stage.EVENT_FOUR,
    name: "Yoshi's Story (Event #4)",
  },
  [Stage.EVENT_FIVE]: {
    id: Stage.EVENT_FIVE,
    name: "Onett (Event #5)",
  },
  [Stage.EVENT_SIX]: {
    id: Stage.EVENT_SIX,
    name: "Fountain of Dreams (Event #6)",
  },
  [Stage.EVENT_SEVEN]: {
    id: Stage.EVENT_SEVEN,
    name: "Pokémon Stadium (Event #7)",
  },
  [Stage.EVENT_EIGHT]: {
    id: Stage.EVENT_EIGHT,
    name: "Brinstar (Event #8)",
  },
  [Stage.EVENT_NINE]: {
    id: Stage.EVENT_NINE,
    name: "Great Bay (Event #9)",
  },
  [Stage.EVENT_TEN_PART_ONE]: {
    id: Stage.EVENT_TEN_PART_ONE,
    name: "Yoshi's Island (Event #10-1)",
  },
  [Stage.EVENT_TEN_PART_TWO]: {
    id: Stage.EVENT_TEN_PART_TWO,
    name: "Jungle Japes (Event #10-2)",
  },
  [Stage.EVENT_TEN_PART_THREE]: {
    id: Stage.EVENT_TEN_PART_THREE,
    name: "Yoshi's Story (Event #10-3)",
  },
  [Stage.EVENT_TEN_PART_FOUR]: {
    id: Stage.EVENT_TEN_PART_FOUR,
    name: "Princess Peach's Castle (Event #10-4)",
  },
  [Stage.EVENT_TEN_PART_FIVE]: {
    id: Stage.EVENT_TEN_PART_FIVE,
    name: "Rainbow Cruise (Event #10-5)",
  },
  [Stage.EVENT_ELEVEN]: {
    id: Stage.EVENT_ELEVEN,
    name: "Icicle Mountain (Event #11)",
  },
  [Stage.EVENT_TWELVE]: {
    id: Stage.EVENT_TWELVE,
    name: "Mute City (Event #12)",
  },
  [Stage.EVENT_THIRTEEN]: {
    id: Stage.EVENT_THIRTEEN,
    name: "Rainbow Cruise (Event #13)",
  },
  [Stage.EVENT_FOURTEEN]: {
    id: Stage.EVENT_FOURTEEN,
    name: "Goomba (Event #14)",
  },
  [Stage.EVENT_FIFTEEN]: {
    id: Stage.EVENT_FIFTEEN,
    name: "Fountain of Dreams (Event #15)",
  },
  [Stage.EVENT_SIXTEEN]: {
    id: Stage.EVENT_SIXTEEN,
    name: "Corneria (Event #16)",
  },
  [Stage.EVENT_SEVENTEEN]: {
    id: Stage.EVENT_SEVENTEEN,
    name: "Jungle Japes (Event #17)",
  },
  [Stage.EVENT_EIGHTEEN]: {
    id: Stage.EVENT_EIGHTEEN,
    name: "Temple (Event #18)",
  },
  [Stage.EVENT_NINETEEN]: {
    id: Stage.EVENT_NINETEEN,
    name: "Final Destination (Event #19)",
  },
  [Stage.EVENT_TWENTY_PART_ONE]: {
    id: Stage.EVENT_TWENTY_PART_ONE,
    name: "Brinstar (Event #20-1)",
  },
  [Stage.EVENT_TWENTY_PART_TWO]: {
    id: Stage.EVENT_TWENTY_PART_TWO,
    name: "Great Bay (Event #20-2)",
  },
  [Stage.EVENT_TWENTY_PART_THREE]: {
    id: Stage.EVENT_TWENTY_PART_THREE,
    name: "Temple (Event #20-3)",
  },
  [Stage.EVENT_TWENTY_PART_FOUR]: {
    id: Stage.EVENT_TWENTY_PART_FOUR,
    name: "Mute City (Event #20-4)",
  },
  [Stage.EVENT_TWENTY_PART_FIVE]: {
    id: Stage.EVENT_TWENTY_PART_FIVE,
    name: "Corneria (Event #20-5)",
  },
  [Stage.EVENT_TWENTY_ONE]: {
    id: Stage.EVENT_TWENTY_ONE,
    name: "Princess Peach's Castle (Event #21)",
  },
  [Stage.EVENT_TWENTY_TWO]: {
    id: Stage.EVENT_TWENTY_TWO,
    name: "Mushroom Kingdom II (Event #22)",
  },
  [Stage.EVENT_TWENTY_THREE]: {
    id: Stage.EVENT_TWENTY_THREE,
    name: "Venom (Event #23)",
  },
  [Stage.EVENT_TWENTY_FOUR]: {
    id: Stage.EVENT_TWENTY_FOUR,
    name: "Yoshi's Island (Event #24)",
  },
  [Stage.EVENT_TWENTY_FIVE]: {
    id: Stage.EVENT_TWENTY_FIVE,
    name: "Fourside (Event #25)",
  },
  [Stage.EVENT_TWENTY_SIX]: {
    id: Stage.EVENT_TWENTY_SIX,
    name: "Entei (Event #26)",
  },
  [Stage.EVENT_TWENTY_SEVEN]: {
    id: Stage.EVENT_TWENTY_SEVEN,
    name: "Brinstar Depths (Event #27)",
  },
  [Stage.EVENT_TWENTY_EIGHT]: {
    id: Stage.EVENT_TWENTY_EIGHT,
    name: "Green Greens (Event #28)",
  },
  [Stage.EVENT_TWENTY_NINE]: {
    id: Stage.EVENT_TWENTY_NINE,
    name: "Temple (Event #29)",
  },
  [Stage.EVENT_THIRTY_PART_ONE]: {
    id: Stage.EVENT_THIRTY_PART_ONE,
    name: "Fountain of Dreams (Event #30-1)",
  },
  [Stage.EVENT_THIRTY_PART_TWO]: {
    id: Stage.EVENT_THIRTY_PART_TWO,
    name: "Pokémon Stadium (Event #30-2)",
  },
  [Stage.EVENT_THIRTY_PART_THREE]: {
    id: Stage.EVENT_THIRTY_PART_THREE,
    name: "Onett (Event #30-3)",
  },
  [Stage.EVENT_THIRTY_PART_FOUR]: {
    id: Stage.EVENT_THIRTY_PART_FOUR,
    name: "Icicle Mountain (Event #30-4)",
  },
  [Stage.EVENT_THIRTY_ONE]: {
    id: Stage.EVENT_THIRTY_ONE,
    name: "Mushroom Kingdom (Event #31)",
  },
  [Stage.EVENT_THIRTY_TWO]: {
    id: Stage.EVENT_THIRTY_TWO,
    name: "Corneria (Event #32)",
  },
  [Stage.EVENT_THIRTY_THREE]: {
    id: Stage.EVENT_THIRTY_THREE,
    name: "F-Zero Grand Prix (Event #33)",
  },
  [Stage.EVENT_THIRTY_FOUR]: {
    id: Stage.EVENT_THIRTY_FOUR,
    name: "Great Bay (Event #34)",
  },
  [Stage.EVENT_THIRTY_FIVE]: {
    id: Stage.EVENT_THIRTY_FIVE,
    name: "Yoshi's Story (Event #35)",
  },
  [Stage.EVENT_THIRTY_SIX_PART_ONE]: {
    id: Stage.EVENT_THIRTY_SIX_PART_ONE,
    name: "Fourside (Event #36-1)",
  },
  [Stage.EVENT_THIRTY_SIX_PART_TWO]: {
    id: Stage.EVENT_THIRTY_SIX_PART_TWO,
    name: "Battlefield (Event #36-2)",
  },
  [Stage.EVENT_THIRTY_SEVEN]: {
    id: Stage.EVENT_THIRTY_SEVEN,
    name: "Battlefield (Event #37)",
  },
  [Stage.EVENT_THIRTY_EIGHT]: {
    id: Stage.EVENT_THIRTY_EIGHT,
    name: "Mushroom Kingdom II (Event #38)",
  },
  [Stage.EVENT_THIRTY_NINE]: {
    id: Stage.EVENT_THIRTY_NINE,
    name: "Pokémon Stadium (Event #39)",
  },
  [Stage.EVENT_FORTY_PART_ONE]: {
    id: Stage.EVENT_FORTY_PART_ONE,
    name: "Temple (Event #40-1)",
  },
  [Stage.EVENT_FORTY_PART_TWO]: {
    id: Stage.EVENT_FORTY_PART_TWO,
    name: "Mushroom Kingdom II (Event #40-2)",
  },
  [Stage.EVENT_FORTY_PART_THREE]: {
    id: Stage.EVENT_FORTY_PART_THREE,
    name: "Poké Floats (Event #40-3)",
  },
  [Stage.EVENT_FORTY_PART_FOUR]: {
    id: Stage.EVENT_FORTY_PART_FOUR,
    name: "Final Destination (Event #40-4)",
  },
  [Stage.EVENT_FORTY_PART_FIVE]: {
    id: Stage.EVENT_FORTY_PART_FIVE,
    name: "Flat Zone (Event #40-5)",
  },
  [Stage.EVENT_FORTY_ONE]: {
    id: Stage.EVENT_FORTY_ONE,
    name: "Temple (Event #41)",
  },
  [Stage.EVENT_FORTY_TWO]: {
    id: Stage.EVENT_FORTY_TWO,
    name: "Poké Floats (Event #42)",
  },
  [Stage.EVENT_FORTY_THREE]: {
    id: Stage.EVENT_FORTY_THREE,
    name: "Big Blue (Event #43)",
  },
  [Stage.EVENT_FORTY_FOUR]: {
    id: Stage.EVENT_FORTY_FOUR,
    name: "Battlefield (Event #44)",
  },
  [Stage.EVENT_FORTY_FIVE]: {
    id: Stage.EVENT_FORTY_FIVE,
    name: "Flat Zone (Event #45)",
  },
  [Stage.EVENT_FORTY_SIX]: {
    id: Stage.EVENT_FORTY_SIX,
    name: "Temple (Event #46)",
  },
  [Stage.EVENT_FORTY_SEVEN]: {
    id: Stage.EVENT_FORTY_SEVEN,
    name: "Majora's Mask (Event #47)",
  },
  [Stage.EVENT_FORTY_EIGHT]: {
    id: Stage.EVENT_FORTY_EIGHT,
    name: "Dream Land (Event #48)",
  },
  [Stage.EVENT_FORTY_NINE_PART_ONE]: {
    id: Stage.EVENT_FORTY_NINE_PART_ONE,
    name: "Mushroom Kingdom (Event #49-1)",
  },
  [Stage.EVENT_FORTY_NINE_PART_TWO]: {
    id: Stage.EVENT_FORTY_NINE_PART_TWO,
    name: "Venom (Event #49-2)",
  },
  [Stage.EVENT_FORTY_NINE_PART_THREE]: {
    id: Stage.EVENT_FORTY_NINE_PART_THREE,
    name: "Pokémon Stadium (Event #49-3)",
  },
  [Stage.EVENT_FORTY_NINE_PART_FOUR]: {
    id: Stage.EVENT_FORTY_NINE_PART_FOUR,
    name: "Great Bay (Event #49-4)",
  },
  [Stage.EVENT_FORTY_NINE_PART_FIVE]: {
    id: Stage.EVENT_FORTY_NINE_PART_FIVE,
    name: "Temple (Event #49-5)",
  },
  [Stage.EVENT_FORTY_NINE_PART_SIX]: {
    id: Stage.EVENT_FORTY_NINE_PART_SIX,
    name: "Final Destination (Event #49-6)",
  },
  [Stage.EVENT_FIFTY]: {
    id: Stage.EVENT_FIFTY,
    name: "Final Destination (Event #50)",
  },
  [Stage.EVENT_FIFTY_ONE]: {
    id: Stage.EVENT_FIFTY_ONE,
    name: "Final Destination (Event #51)",
  },
  [Stage.MULTI_MAN_MELEE]: {
    id: Stage.MULTI_MAN_MELEE,
    name: "Battlefield (Multi-Man Melee)",
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
