import { SlippiGame } from "../src";
import { didLoseStock } from "../src/stats/common";

describe("when calculating stats", () => {
  it("should correctly calculate L cancel counts", () => {
    const game = new SlippiGame("slp/lCancel.slp");
    const stats = game.getStats();
    const p1Success = stats.actionCounts[0].lCancelSuccessCount;
    const p1Fail = stats.actionCounts[0].lCancelFailCount;
    expect(p1Success).toBe(3);
    expect(p1Fail).toBe(4);
    const p2Success = stats.actionCounts[1].lCancelSuccessCount;
    const p2Fail = stats.actionCounts[1].lCancelFailCount;
    expect(p2Success).toBe(5);
    expect(p2Fail).toBe(4);
  });

  describe("when calculating total damage done", () => {
    it("should ignore Blast Zone Magnifying Glass damage", () => {
      const game = new SlippiGame("slp/consistencyTest/Puff-MagnifyingGlass-10.slp");
      const stats = game.getStats();
      const puff = stats.overall[0];
      const yl = stats.overall[1];
      let totalDamagePuffDealt = 0;
      stats.conversions.forEach((conversion) => {
        if (conversion.lastHitBy === puff.playerIndex) {
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
        if (conversion.playerIndex === pichu.playerIndex) {
          icsDamageDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
        }
        if (conversion.playerIndex === ics.playerIndex) {
          totalDamagePichuDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
        }
      });
      expect(totalDamagePichuDealt).toBe(pichu.totalDamage);
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
        if (conversion.lastHitBy === ness.playerIndex) {
          totalDamageNessDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
        }
        if (conversion.lastHitBy === fox.playerIndex) {
          totalDamageFoxDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
        }
      });
      expect(totalDamageNessDealt).toBe(ness.totalDamage);
      expect(ness.killCount).toBe(0);
      expect(ness.conversionCount).toBe(0);

      expect(totalDamageFoxDealt).toBe(fox.totalDamage);
      expect(fox.killCount).toBe(0);
      expect(fox.conversionCount).toBe(2);
    });
  });
});

describe("when using common functions", () => {
  it("should return false if required", () => {
    expect(didLoseStock(undefined, undefined)).toEqual(false);
  });
});
