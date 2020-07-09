import { SlippiGame } from "./SlippiGame";

import * as animations from "./melee/animations";
import * as characters from "./melee/characters";
import * as moves from "./melee/moves";
import * as stages from "./melee/stages";

export * from "./stats";
export * from "./utils";
export * from "./console";

export {
  animations,
  characters,
  moves,
  stages,
  SlippiGame, // Support both named and default exports
};

export default SlippiGame;
