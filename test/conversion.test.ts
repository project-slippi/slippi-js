import { SlippiGame } from "../src/node/index";

describe("when calculating conversions", () => {
  it("should include Puff's Sing", () => {
    const game = new SlippiGame("slp/consistencyTest/PuffVFalcon-Sing.slp");
    const stats = game.getStats()!;
    const puff = stats.overall[0]!;
    let totalDamagePuffDealt = 0;
    stats.conversions.forEach((conversion) => {
      if (conversion.lastHitBy === puff.playerIndex) {
        totalDamagePuffDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
      }
    });
    expect(totalDamagePuffDealt).toBe(puff.totalDamage);
    expect(puff.killCount).toBe(0);
    expect(puff.conversionCount).toBe(2);
  });

  it("should include Bowser's command grab", () => {
    const game = new SlippiGame("slp/consistencyTest/BowsVDK-SB-63.slp");
    const stats = game.getStats()!;
    const bowser = stats.overall[0]!;
    let totalDamageBowserDealt = 0;
    stats.conversions.forEach((conversion) => {
      if (conversion.lastHitBy === bowser.playerIndex) {
        totalDamageBowserDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
      }
    });
    // Bowser did around 63% to DK
    expect(bowser.totalDamage).toBeGreaterThanOrEqual(63);
    expect(bowser.totalDamage).toBe(totalDamageBowserDealt);
    expect(bowser.killCount).toBe(0);
    expect(bowser.conversionCount).toBe(3);
  });

  it("should include Falcon's command grab", () => {
    const game = new SlippiGame("slp/consistencyTest/FalcVBows-5UB-67.slp");
    const stats = game.getStats()!;
    const falcon = stats.overall[0]!;
    let totalDamageFalconDealt = 0;
    stats.conversions.forEach((conversion) => {
      if (conversion.lastHitBy === falcon.playerIndex) {
        totalDamageFalconDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
      }
    });
    expect(totalDamageFalconDealt).toBe(falcon.totalDamage);
    expect(falcon.killCount).toBe(0);
    expect(falcon.conversionCount).toBe(3);
  });

  it("should include Ganon's command grab", () => {
    const game = new SlippiGame("slp/consistencyTest/GanonVDK-5UB-73.slp");
    const stats = game.getStats()!;
    const ganon = stats.overall[0]!;
    let totalDamageGanonDealt = 0;
    stats.conversions.forEach((conversion) => {
      if (conversion.lastHitBy === ganon.playerIndex) {
        totalDamageGanonDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
      }
    });
    expect(totalDamageGanonDealt).toBe(ganon.totalDamage);
    expect(ganon.killCount).toBe(0);
    expect(ganon.conversionCount).toBe(5);
  });

  it("should include Kirby's command grab", () => {
    const game = new SlippiGame("slp/consistencyTest/KirbyVDK-Neutral-17.slp");
    const stats = game.getStats()!;
    const kirby = stats.overall[0]!;
    let totalDamageKirbyDealt = 0;
    stats.conversions.forEach((conversion) => {
      if (conversion.lastHitBy === kirby.playerIndex) {
        totalDamageKirbyDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
      }
    });
    expect(totalDamageKirbyDealt).toBe(kirby.totalDamage);
    expect(kirby.killCount).toBe(0);
    expect(kirby.conversionCount).toBe(3);
  });

  it("should include Yoshi's command grab", () => {
    const game = new SlippiGame("slp/consistencyTest/YoshiVDK-Egg-13.slp");
    const stats = game.getStats()!;
    const yoshi = stats.overall[0]!;
    let totalDamageYoshiDealt = 0;
    stats.conversions.forEach((conversion) => {
      if (conversion.lastHitBy === yoshi.playerIndex) {
        totalDamageYoshiDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
      }
    });
    expect(totalDamageYoshiDealt).toBe(yoshi.totalDamage);
    expect(yoshi.killCount).toBe(0);
    expect(yoshi.conversionCount).toBe(2);
  });

  it("should include Mewtwo's command grab", () => {
    const game = new SlippiGame("slp/consistencyTest/MewTwoVDK-SB-42.slp");
    const stats = game.getStats()!;
    const mewTwo = stats.overall[0]!;
    let totalDamageMewTwoDealt = 0;
    stats.conversions.forEach((conversion) => {
      if (conversion.lastHitBy === mewTwo.playerIndex) {
        totalDamageMewTwoDealt += conversion.moves.reduce((total, move) => total + move.damage, 0);
      }
    });
    expect(totalDamageMewTwoDealt).toBe(mewTwo.totalDamage);
    expect(mewTwo.killCount).toBe(0);
    expect(mewTwo.conversionCount).toBe(1);
  });

  it("should not create two conversions for 1 kirby neutral B", () => {
    const game = new SlippiGame("slp/consistencyTest/KirbyVMario-nB.slp");
    const stats = game.getStats()!;
    const kirby = stats.overall[0]!;
    const mario = stats.overall[1]!;
    expect(kirby.conversionCount).toBe(1);
    expect(mario.conversionCount).toBe(0);
  });

  it("should not create conversions for DK aerial neutral B windup", () => {
    const game = new SlippiGame("slp/consistencyTest/DKVBows-nB.slp");
    const stats = game.getStats()!;
    const dk = stats.overall[0]!;
    const bowser = stats.overall[1]!;
    expect(dk.conversionCount).toBe(0);
    expect(bowser.conversionCount).toBe(0);
  });
});
