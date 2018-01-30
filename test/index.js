import SlippiGame from '../src';
import _ from 'lodash';

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
  expect(stats.gameDuration).toBe(3694);
  // console.log(stats.events.punishes);
});

test('test metadata', () => {
  const game = new SlippiGame("test/test.slp");
  const metadata = game.getMetadata();
});
