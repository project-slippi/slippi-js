import { SlippiGame } from './SlippiGame';

import * as animations from './melee/animations';
import * as characters from './melee/characters';
import * as moves from './melee/moves';
import * as stages from './melee/stages';

import fs from "fs";
import { SlpStream, SlpEvent } from './utils/slpStream';

export {
  animations,
  characters,
  moves,
  stages,
  SlippiGame, // Support both named and default exports
};


const stream = fs.createReadStream("slp/sheik_vs_ics_yoshis.slp");
const slp = new SlpStream(stream);
slp.on(SlpEvent.GAME_END, () => {
  console.log("game ended");
});

slp.on(SlpEvent.GAME_START, () => {
  console.log("game started");
});

slp.on(SlpEvent.PRE_FRAME_UPDATE, () => {
  console.log("got pre frame update");
});

slp.on(SlpEvent.POST_FRAME_UPDATE, () => {
  console.log("got post frame update");
});

export default SlippiGame;
