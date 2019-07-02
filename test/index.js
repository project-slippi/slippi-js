import _ from 'lodash';
// import path from 'path';
import fs from 'fs';
import SlippiGame from '../src';

test('read settings', () => {
  const game = new SlippiGame("test/sheik_vs_ics_yoshis.slp");
  const settings = game.getSettings();
  expect(settings.stageId).toBe(8);
  expect(_.first(settings.players).characterId).toBe(0x13);
  expect(_.last(settings.players).characterId).toBe(0xE);
});

test('test stats', () => {
  const game = new SlippiGame("test/test.slp");
  const stats = game.getStats();
  expect(stats.lastFrame).toBe(3694);

  // Test stocks
  // console.log(stats);
  expect(stats.stocks.length).toBe(5);
  expect(_.last(stats.stocks).endFrame).toBe(3694);

  // Test conversions
  // console.log(stats.events.punishes);
  expect(stats.conversions.length).toBe(10);
  const firstConversion = _.first(stats.conversions);
  expect(firstConversion.moves.length).toBe(4);
  expect(_.first(firstConversion.moves).moveId).toBe(15);
  expect(_.last(firstConversion.moves).moveId).toBe(17);

  // Test action counts
  expect(stats.actionCounts[0].wavedashCount).toBe(16);
  expect(stats.actionCounts[0].wavelandCount).toBe(1);
  expect(stats.actionCounts[0].airDodgeCount).toBe(3);

  // Test overall
  expect(stats.overall[0].inputCount).toBe(459);
});

test('test metadata', () => {
  const game = new SlippiGame("test/test.slp");
  const metadata = game.getMetadata();
  expect(metadata.startAt).toBe("2017-12-18T21:14:14Z");
  expect(metadata.playedOn).toBe("dolphin");
});

test('test incomplete', () => {
  const game = new SlippiGame("test/incomplete.slp");
  const settings = game.getSettings();
  expect(settings.players.length).toBe(2);
  expect(game.getGameEnd()).toBe(null);
  game.getMetadata();
  game.getStats();
});

test('test nametags', () => {
  const game = new SlippiGame("test/nametags.slp");
  const settings = game.getSettings();
  expect(settings.players[0].nametag).toBe("AMNイ");
  expect(settings.players[1].nametag).toBe("");

  const game2 = new SlippiGame("test/nametags2.slp");
  const settings2 = game2.getSettings();
  expect(settings2.players[0].nametag).toBe("A1=$");
  expect(settings2.players[1].nametag).toBe("か、9@");

  const game3 = new SlippiGame("test/nametags3.slp");
  const settings3 = game3.getSettings();
  expect(settings3.players[0].nametag).toBe("B  R");
  expect(settings3.players[1].nametag).toBe(".  。");
});

test('test isPAL', () => {
  const palGame = new SlippiGame("test/pal.slp");
  const ntscGame = new SlippiGame("test/ntsc.slp");

  expect(palGame.getSettings().isPAL).toBe(true);
  expect(ntscGame.getSettings().isPAL).toBe(false);
});

test('test controllerFixes', () => {
  const game = new SlippiGame("test/controllerFixes.slp");
  const settings = game.getSettings();
  expect(settings.players[0].controllerFix).toBe("Dween");
  expect(settings.players[1].controllerFix).toBe("UCF");
  expect(settings.players[2].controllerFix).toBe("None");
});

test('test bufferInput', () => {
  const buf = fs.readFileSync("test/sheik_vs_ics_yoshis.slp");
  const game = new SlippiGame(buf);
  const settings = game.getSettings();
  expect(settings.stageId).toBe(8);
  expect(_.first(settings.players).characterId).toBe(0x13);
  expect(_.last(settings.players).characterId).toBe(0xE);
});

test('test v2 gameEnd', () => {
  const game = new SlippiGame("test/testv2.slp");
  const gameEnd = game.getGameEnd();
  expect(gameEnd.gameEndMethod).toBe(1);
  expect(gameEnd.lrasInitiatorIndex).toBe(-1);
});

test('test realtime', () => {
  const fullData = fs.readFileSync("test/realtimeTest.slp");
  const buf = Buffer.alloc(100e6); // Allocate 100 MB of space
  const game = new SlippiGame(buf);

  let data, copyPos = 0;

  const getData = () => ({
    settings: game.getSettings(),
    frames: game.getFrames(),
    metadata: game.getMetadata(),
    gameEnd: game.getGameEnd(),
    stats: game.getStats(),
    latestFrame: game.getLatestFrame(),
  });

  const copyBuf = (len) => {
    const res = fullData.copy(buf, copyPos, copyPos, copyPos + len);
    copyPos += res;
  };

  // Test results with empty buffer
  data = getData();
  expect(data.settings).toBe(null);
  expect(data.frames).toEqual({});
  expect(data.metadata).toBe(null);
  expect(data.gameEnd).toBe(null);
  expect(data.stats).toEqual({
    "actionCounts": [],
    "combos": [],
    "conversions": [],
    "gameComplete": false,
    "lastFrame": null,
    "overall": [],
    "playableFrameCount": null,
    "stocks": [],
  });
  expect(data.latestFrame).toBe(null);

  // Add the header and 0x35 command to buffer
  copyBuf(0x1D);
  data = getData();

  // Copy settings
  copyBuf(0x1A3);
  data = getData();
  expect(data.settings.stageId).toBe(8);

  // Copy first 3 frames
  copyBuf(0xE8 * 3);
  data = getData();
  expect(_.size(data.frames)).toBe(3);
  expect(data.latestFrame.frame).toBe(-122); // Eventually this should be -121
  expect(data.stats.stocks[1].endFrame).toBe(null);

  // Load the rest of the game data
  copyBuf(0x8271B);
  data = getData();
  expect(_.size(data.frames)).toBe(2306);
  expect(data.stats.lastFrame).toBe(2182);
  expect(data.gameEnd.gameEndMethod).toBe(7);
  expect(data.latestFrame.frame).toBe(2182);
  expect(data.stats.stocks[1].endFrame).toBe(766);

  // Load metadata
  copyBuf(0xA7);
  data = getData();
  expect(data.metadata.playedOn).toBe("network");
});

// test('test speedReadTest', () => {
//   const replayPath = "D:\\Slippi\\Tournament-Replays\\Smash-in-Wittenberg-5";

//   const dirContents = fs.readdirSync(replayPath, {
//     withFileTypes: true,
//   }) || [];

//   // Loop through and upload all of the slp files
//   _.forEach(dirContents, (folder) => {
//     if (!folder.isDirectory()) {
//       return;
//     }

//     console.log(folder.name);
//     const subPath = path.join(replayPath, folder.name);
//     const subDirContents = fs.readdirSync(subPath, {
//       withFileTypes: true,
//     }) || [];

//     // Iterate for files now
//     _.forEach(subDirContents, (file) => {
//       if (!file.isFile()) {
//         return;
//       }

//       if (path.extname(file.name) !== ".slp") {
//         return;
//       }

//       const filePath = path.join(subPath, file.name);

//       const game = new SlippiGame(filePath);
//       game.getMetadata();
//     });
//   });
// });
