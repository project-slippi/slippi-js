import { SlippiGame } from './SlippiGame';

import * as animations from './melee/animations';
import * as characters from './melee/characters';
import * as moves from './melee/moves';
import * as stages from './melee/stages';

import fs from "fs";
import { SlippiRealtime } from './SlippiRealtime';

export {
  animations,
  characters,
  moves,
  stages,
  SlippiGame, // Support both named and default exports
};

const frameToTest = 1337;
const fileToTest = "slp/sheik_vs_ics_yoshis.slp";


const stream = fs.createReadStream(fileToTest);
const slp = new SlippiRealtime(stream);
let gameEnded = false;
slp.on("gameStart", () => {
  console.log("game started");
});

slp.on("gameEnd", () => {
  console.log("game ended");
  gameEnded = true;
});

slp.on("newFrame", (frame: any) => {
  console.log(`new frame: ${frame.frame}`);
});
slp.start();

while (!gameEnded);

const game = new SlippiGame(fileToTest);
const frames = game.getFrames();
console.log(JSON.stringify(frames[frameToTest]));

export default SlippiGame;
