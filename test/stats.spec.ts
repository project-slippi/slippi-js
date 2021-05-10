import { PostFrameUpdateType, SlippiGame } from "../src";
import { didLoseStock } from "../src/stats/common";

const expectedThrow = {
  up: 1,
  forward: 1,
  back: 2,
  down: 1,
};

const expectedGrab = {
  success: 6,
  fail: 2,
};

describe("when calculating stats", () => {
  it("should correctly calculate L cancel counts", () => {
    const game = new SlippiGame("slp/lCancel.slp");
    const stats = game.getStats();
    const p1Success = stats.actionCounts[0].lCancelCount.success;
    const p1Fail = stats.actionCounts[0].lCancelCount.fail;
    expect(p1Success).toBe(3);
    expect(p1Fail).toBe(4);
    const p2Success = stats.actionCounts[1].lCancelCount.success;
    const p2Fail = stats.actionCounts[1].lCancelCount.fail;
    expect(p2Success).toBe(5);
    expect(p2Fail).toBe(4);
  });

  it("should correctly calculate throw counts", () => {
    const game = new SlippiGame("slp/throwGrab.slp");
    const stats = game.getStats();
    const p2Throws = stats.actionCounts[1].throwCount;
    expect(p2Throws).toEqual(expectedThrow);
  });

  it("should correctly calculate grab counts", () => {
    const game = new SlippiGame("slp/throwGrab.slp");
    const stats = game.getStats();
    const p2Grabs = stats.actionCounts[1].grabCount;
    expect(p2Grabs).toEqual(expectedGrab);
  });

  describe("when calculating total damage done", () => {
    it("should include throw damage", () => {
      const game = new SlippiGame("slp/throwGrab.slp");
      const stats = game.getStats();
      const falco = stats.overall[0];
      const marth = stats.overall[1];
      expect(marth.totalDamage).toBeGreaterThanOrEqual(75 + 120);
      expect(falco.totalDamage).toBeGreaterThanOrEqual(117 + 153);
    });

    it("should include pummel damage", () => {
      const game = new SlippiGame("slp/pummel.slp");
      const stats = game.getStats();
      const marth = stats.overall[0];
      const sheik = stats.overall[1];
      expect(marth.totalDamage).toBeGreaterThanOrEqual(14);
      expect(sheik.totalDamage).toBeGreaterThanOrEqual(21);
    });

    it("should ignore Blast Zone Magnifying Glass damage", () => {
      const game = new SlippiGame("slp/consistencyTest/Puff-MagnifyingGlass-10.slp");
      const stats = game.getStats();
      const puff = stats.overall[0];
      const yl = stats.overall[1];
      let totalDamagePuffDealt = 0;
      stats.conversions.forEach((conversion) => {
        if (conversion.playerIndex === puff.playerIndex) {
          totalDamagePuffDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
        }
      });
      expect(totalDamagePuffDealt).toBe(puff.totalDamage);
      expect(puff.killCount).toBe(0);
      expect(puff.conversionCount).toBe(0);
      expect(yl.totalDamage).toBe(0);
    });

    it("should ignore Pichu's self-damage", () => {
      const game = new SlippiGame("slp/consistencyTest/PichuVSelf-All-22.slp");
      const stats = game.getStats();
      const pichu = stats.overall[0];
      const ics = stats.overall[1];
      const pichuStock = stats.stocks.filter((s) => s.playerIndex === pichu.playerIndex)[0];
      const icsStock = stats.stocks.filter((s) => s.playerIndex === ics.playerIndex)[0];
      let totalDamagePichuDealt = 0;
      let icsDamageDealt = 0;
      stats.conversions.forEach((conversion) => {
        switch (conversion.playerIndex) {
          case pichu.playerIndex: {
            totalDamagePichuDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
            break;
          }
          case ics.playerIndex: {
            icsDamageDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
            break;
          }
        }
      });
      // Pichu should have done at least 32% damage
      expect(pichu.totalDamage).toBeGreaterThanOrEqual(32);
      expect(pichu.totalDamage).toBe(totalDamagePichuDealt);
      // Pichu's self-damage should not count towards its own total damage dealt
      expect(pichu.totalDamage).not.toBe(pichuStock.currentPercent + icsStock.currentPercent);
      expect(pichu.killCount).toBe(0);
      expect(ics.totalDamage).toBe(0);
      expect(ics.totalDamage).toBe(icsDamageDealt);
      expect(pichu.conversionCount).toBe(3);
    });

    it("should ignore Ness' damage recovery", () => {
      const game = new SlippiGame("slp/consistencyTest/NessVFox-Absorb.slp");
      const stats = game.getStats();
      const ness = stats.overall[0];
      const fox = stats.overall[1];
      let totalDamageNessDealt = 0;
      let totalDamageFoxDealt = 0;
      stats.conversions.forEach((conversion) => {
        if (conversion.playerIndex === ness.playerIndex) {
          totalDamageNessDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
        }
        if (conversion.playerIndex === fox.playerIndex) {
          totalDamageFoxDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
        }
      });
      // Ness did no damage to fox
      expect(ness.totalDamage).toBe(0);
      expect(ness.totalDamage).toBe(totalDamageNessDealt);
      expect(ness.killCount).toBe(0);
      expect(ness.conversionCount).toBe(0);

      expect(totalDamageFoxDealt).toBe(fox.totalDamage);
      expect(fox.killCount).toBe(0);
      expect(fox.conversionCount).toBe(2);
    });
  });
});

describe("when calculating stock information", () => {
  it("should handle invalid values", () => {
    expect(didLoseStock(undefined, undefined)).toEqual(false);
    expect(didLoseStock({ stocksRemaining: null } as PostFrameUpdateType, {} as PostFrameUpdateType)).toEqual(false);
  });
});
