# Introduction
This is the official .slp file parsing library. It parses a .slp file into structured data and can be used to compute stats. There are already many built-in stats that are computed by the library but the data provided can also be used to compute your own stats.

# Quick-Start
## Requirements
* node – https://nodejs.org/en/download/
## Writing a simple script
1) Create a fresh directory on your disk
1) Inside this new directory, create a file called `script.js`
1) Fill the `script.js` file with the following contents:
```
const { default: SlippiGame } = require('slp-parser-js');

const game = new SlippiGame("test.slp");

// Get game settings – stage, characters, etc
const settings = game.getSettings();
console.log(settings);

// Get metadata - start time, platform played on, etc
const metadata = game.getMetadata();
console.log(metadata);

// Get computed stats - openings / kill, conversions, etc
const stats = game.getStats();
console.log(stats);

// Get frames – animation state, inputs, etc
// This is used to compute your own stats or get more frame-specific info (advanced)
const frames = game.getFrames();
console.log(frames[0].players); // Print frame when timer starts counting down
```
4) Copy a .slp file into the directory and call it `test.slp`
4) Browse to the directory from the command line and run the command: `npm install slp-parser-js`. This should create a `node_modules` directory in the folder.
4) Run the command: `node script.js`. This will run the script above and will print data about the `test.slp` file
## Reading live files
When using Slippi to mirror gameplay, it can be useful to extract game data about the live game. There are a few different methods of doing this but `slp-parser-js` can also be used to read live files. It is written in such a way where as long as the same SlippiGame class is used, it will only read from disk the data it has not yet read.

An example script for how to do this is provided as part of this repo here: https://github.com/project-slippi/slp-parser-js/blob/master/scripts/realtimeFileReads.js

To use the above script, do the following:
1) Open a terminal prompt in the folder containing the script file and the package.json file
1) Run `yarn` to fetch the dependencies
1) Run `node realtimeFileReads.js "C:\mirror\output\path"`

At this point, you should see an output as you play games on the connected console.

