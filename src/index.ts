import _ from "lodash";

import { SlippiGame } from './SlippiGame';

import * as animations from './melee/animations';
import * as characters from './melee/characters';
import * as moves from './melee/moves';
import * as stages from './melee/stages';
import { getSinglesOpponentIndicesFromSettings } from "./stats/common";
import { Stats } from "./stats/stats";

export {
  animations,
  characters,
  moves,
  stages,
  SlippiGame, // Support both named and default exports
};


const fileToTest = "slp/sheik_vs_ics_yoshis.slp";
const game = new SlippiGame(fileToTest);
const settings = game.getSettings();

const statCalculator = new Stats(getSinglesOpponentIndicesFromSettings(settings));
const frames = game.getFrames();
const sortedFrames = _.orderBy(frames, 'frame');
sortedFrames.forEach(frame => {
  statCalculator.processFrame(frame);
});

console.log("new");
console.log(JSON.stringify(statCalculator.getStats().actionCounts));

console.log("orig");
console.log(JSON.stringify(game.getStats().actionCounts))

export default SlippiGame;
