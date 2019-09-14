import { SlippiGame } from './SlippiGame';

import * as animations from './melee/animations';
import * as characters from './melee/characters';
import * as moves from './melee/moves';
import * as stages from './melee/stages';

import fs from "fs";
import { SlpParser } from './utils/slpParser';
import { SlpStream, SlpEvent } from './utils/slpStream';
import { GameStartType, PostFrameUpdateType } from './utils/slpReader';

export {
  animations,
  characters,
  moves,
  stages,
  SlippiGame, // Support both named and default exports
};


const stream = fs.createReadStream("slp/sheik_vs_ics_yoshis.slp");
const parser = new SlpParser();
const slp = new SlpStream(stream);
slp.on(SlpEvent.GAME_START, (payload: GameStartType) => {
  parser.handleGameStart(payload);
});

slp.on(SlpEvent.POST_FRAME_UPDATE, (payload: PostFrameUpdateType) => {
  parser.handlePostFrameUpdate(payload);
});

slp.on(SlpEvent.GAME_END, () => {
  console.log(parser.getSettings());
});

export default SlippiGame;
