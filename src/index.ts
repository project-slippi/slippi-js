import { SlippiGame } from './SlippiGame';

import * as animations from './melee/animations';
import * as characters from './melee/characters';
import * as moves from './melee/moves';
import * as stages from './melee/stages';

import fs from "fs";
import { SlpStream } from './utils/slpStream';

export {
  animations,
  characters,
  moves,
  stages,
  SlippiGame, // Support both named and default exports
};


const stream = fs.createReadStream("slp/sheik_vs_ics_yoshis.slp");
const slp = new SlpStream(stream);

export default SlippiGame;
