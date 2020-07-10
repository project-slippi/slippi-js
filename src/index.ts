import { SlippiGame } from "./SlippiGame";

import * as animations from "./melee/animations";
import * as characters from "./melee/characters";
import * as moves from "./melee/moves";
import * as stages from "./melee/stages";

// Export types
export * from "./types";
export * from "./stats";

// Utils
export * from "./utils/pipeFileContents";
export * from "./utils/slpFile";
export * from "./utils/slpStream";
export * from "./utils/slpParser";
export { parseMessage } from "./utils/slpReader";

// Console networking
export * from "./console";

export {
  animations,
  characters,
  moves,
  stages,
  SlippiGame, // Support both named and default exports
};

export default SlippiGame;
