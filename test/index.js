import SlippiGame from '../src';

test('read settings', () => {
  const game = new SlippiGame("test/test.slp");
  const settings = game.getSettings();
  expect(settings.stageId).toBe(31);
});
