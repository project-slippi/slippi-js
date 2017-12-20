import SlippiGame from '../src';

test('read settings', () => {
  const game = new SlippiGame("test/test.slp");
  const settings = game.getSettings();
  expect(settings.stageId).toBe(28);
});

test('test stats', () => {
  const game = new SlippiGame("test/test.slp");
  const stats = game.getStats();
  // console.log(stats.events.punishes);
});
