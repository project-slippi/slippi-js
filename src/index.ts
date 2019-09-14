import { SlippiGame } from './SlippiGame';

import * as animations from './melee/animations';
import * as characters from './melee/characters';
import * as moves from './melee/moves';
import * as stages from './melee/stages';

import fs from "fs";
import { SlpParser } from './utils/slpParser';
import { SlpStream, SlpEvent } from './utils/slpStream';
import { GameStartType, PostFrameUpdateType, PreFrameUpdateType, Command, GameEndType } from './utils/slpReader';

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
slp.on(SlpEvent.GAME_START, (command: Command, payload: GameStartType) => {
  parser.handleGameStart(payload);
});

slp.on(SlpEvent.POST_FRAME_UPDATE, (command: Command, payload: PostFrameUpdateType) => {
  parser.handlePostFrameUpdate(payload);
  parser.handleFrameUpdate(command, payload);
});

slp.on(SlpEvent.PRE_FRAME_UPDATE, (command: Command, payload: PreFrameUpdateType) => {
  parser.handleFrameUpdate(command, payload);
});

const frameToTest = 1337;

slp.on(SlpEvent.GAME_END, (command: Command, payload: GameEndType) => {
  parser.handleGameEnd(payload);
  console.log(parser.getSettings());
  const frames = parser.getFrames();
  console.log(JSON.stringify(frames[frameToTest]));
});

const game = new SlippiGame("slp/sheik_vs_ics_yoshis.slp");
const frames = game.getFrames();
console.log(JSON.stringify(frames[frameToTest]));

export default SlippiGame;
