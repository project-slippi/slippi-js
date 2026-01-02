import { PostFrameUpdateType } from "../src/common/index";
import { didLoseStock } from "../src/common/stats/common";
import { SlippiGame } from "../src/node/index";

const expectedThrow = {
  up: 1,
  forward: 1,
  back: 2,
  down: 1,
};

const expectedGrab = {
  success: 7,
  fail: 3,
};

describe("when calculating stats", () => {
  it("should distinguish between edge cancels and other interrupted aerials", () => {
    const game = new SlippiGame("slp/edge-cancel-2.slp");
    const stats = game.getStats()!;
    const lCancel = stats.actionCounts[0]!.lCancelCount.success;
    const lCancelfail = stats.actionCounts[0]!.lCancelCount.fail;
    const edgeCancel = stats.actionCounts[0]!.edgeCancelCount.success;
    const slowEdgeCancel = stats.actionCounts[0]!.edgeCancelCount.slow;
    expect(lCancel).toBe(5);
    expect(lCancelfail).toBe(3);
    expect(edgeCancel).toBe(4);
    expect(slowEdgeCancel).toBe(0);
  });

  it("should correctly count edge cancels and not count edge cancels as failed L cancels", () => {
    const game = new SlippiGame("slp/edge-cancel-1.slp");
    const stats = game.getStats()!;
    const lCancel = stats.actionCounts[0]!.lCancelCount.success;
    const lCancelfail = stats.actionCounts[0]!.lCancelCount.fail;
    const edgeCancel = stats.actionCounts[0]!.edgeCancelCount.success;
    const slowEdgeCancel = stats.actionCounts[0]!.edgeCancelCount.slow;
    expect(lCancel).toBe(0);
    expect(lCancelfail).toBe(2);
    expect(edgeCancel).toBe(4);
    expect(slowEdgeCancel).toBe(1);
  });

  it("should correctly calculate L cancel counts", () => {
    const game = new SlippiGame("slp/lCancel.slp");
    const stats = game.getStats()!;
    const p1Success = stats.actionCounts[0]!.lCancelCount.success;
    const p1Fail = stats.actionCounts[0]!.lCancelCount.fail;
    expect(p1Success).toBe(3);
    expect(p1Fail).toBe(4);
    const p2Success = stats.actionCounts[1]!.lCancelCount.success;
    const p2Fail = stats.actionCounts[1]!.lCancelCount.fail;
    expect(p2Success).toBe(5);
    expect(p2Fail).toBe(4);
  });

  it("should count repeat actions properly", () => {
    const game = new SlippiGame("slp/actionEdgeCases.slp");
    const stats = game.getStats()!;
    const p1Bairs = stats.actionCounts[0]!.attackCount.bair;
    const p1SpotDodge = stats.actionCounts[0]!.spotDodgeCount;
    expect(p1Bairs).toBe(8);
    expect(p1SpotDodge).toBe(4);
  });

  it("should count angled attacks properly", () => {
    const game = new SlippiGame("slp/actionEdgeCases.slp");
    const stats = game.getStats()!;
    const p1Ftilts = stats.actionCounts[0]!.attackCount.ftilt;
    const p1Fsmashes = stats.actionCounts[0]!.attackCount.fsmash;
    expect(p1Ftilts).toBe(3);
    expect(p1Fsmashes).toBe(3);
  });

  it("should count gnw weird moveset correctly", () => {
    const game = new SlippiGame("slp/gnwActions.slp");
    const stats = game.getStats()!;
    const p1Jab1s = stats.actionCounts[0]!.attackCount.jab1;
    const p1Jabms = stats.actionCounts[0]!.attackCount.jabm;
    const p1Ftilts = stats.actionCounts[0]!.attackCount.ftilt;
    const p1Utilts = stats.actionCounts[0]!.attackCount.utilt;
    const p1Dtilts = stats.actionCounts[0]!.attackCount.dtilt;
    const p1Fsmashes = stats.actionCounts[0]!.attackCount.fsmash;
    const p1Usmashes = stats.actionCounts[0]!.attackCount.usmash;
    const p1Dsmashes = stats.actionCounts[0]!.attackCount.dsmash;
    const p1Nairs = stats.actionCounts[0]!.attackCount.nair;
    const p1Fairs = stats.actionCounts[0]!.attackCount.fair;
    const p1Bairs = stats.actionCounts[0]!.attackCount.bair;
    const p1Uairs = stats.actionCounts[0]!.attackCount.uair;
    const p1Dairs = stats.actionCounts[0]!.attackCount.dair;
    const p1LCancelSuccess = stats.actionCounts[0]!.lCancelCount.success;
    const p1LCancelFail = stats.actionCounts[0]!.lCancelCount.fail;
    expect(p1Jab1s).toBe(2);
    expect(p1Jabms).toBe(1);
    expect(p1Ftilts).toBe(1);
    expect(p1Utilts).toBe(1);
    expect(p1Dtilts).toBe(1);
    expect(p1Fsmashes).toBe(1);
    expect(p1Usmashes).toBe(1);
    expect(p1Dsmashes).toBe(1);
    expect(p1Nairs).toBe(1);
    expect(p1Fairs).toBe(1);
    expect(p1Bairs).toBe(1);
    expect(p1Uairs).toBe(1);
    expect(p1Dairs).toBe(1);
    expect(p1LCancelSuccess).toBe(2);
    expect(p1LCancelFail).toBe(0);
  });

  it("should count jabs properly", () => {
    const game = new SlippiGame("slp/actionEdgeCases.slp");
    const stats = game.getStats()!;
    const p1Jab1s = stats.actionCounts[0]!.attackCount.jab1;
    const p1Jab2s = stats.actionCounts[0]!.attackCount.jab2;
    const p1Jab3s = stats.actionCounts[0]!.attackCount.jab3;
    const p1Jabms = stats.actionCounts[0]!.attackCount.jabm;
    expect(p1Jab1s).toBe(4);
    expect(p1Jab2s).toBe(3);
    expect(p1Jab3s).toBe(2);
    expect(p1Jabms).toBe(1);
  });

  it("should count grabs even if frame perfect throw", () => {
    const game = new SlippiGame("slp/actionEdgeCases.slp");
    const stats = game.getStats()!;
    const p1GrabSuccess = stats.actionCounts[0]!.grabCount.success;
    const p1GrabFail = stats.actionCounts[0]!.grabCount.fail;
    expect(p1GrabSuccess).toBe(4);
    expect(p1GrabFail).toBe(1);
  });

  it("should count dash attacks correctly despite boost grabs", () => {
    const game = new SlippiGame("slp/actionEdgeCases.slp");
    const stats = game.getStats()!;
    const p1DashAttack = stats.actionCounts[0]!.attackCount.dash;
    expect(p1DashAttack).toBe(2);
  });

  it("should correctly calculate throw counts", () => {
    const game = new SlippiGame("slp/throwGrab.slp");
    const stats = game.getStats()!;
    const p2Throws = stats.actionCounts[1]!.throwCount;
    expect(p2Throws).toEqual(expectedThrow);
  });

  it("should correctly calculate grab counts", () => {
    const game = new SlippiGame("slp/throwGrab.slp");
    const stats = game.getStats()!;
    const p2Grabs = stats.actionCounts[1]!.grabCount;
    expect(p2Grabs).toEqual(expectedGrab);
  });

  describe("when calculating total damage done", () => {
    it("should include throw damage", () => {
      const game = new SlippiGame("slp/throwGrab.slp");
      const stats = game.getStats()!;
      const falco = stats.overall[0]!;
      const marth = stats.overall[1]!;
      expect(marth.totalDamage).toBeGreaterThanOrEqual(75 + 120);
      expect(falco.totalDamage).toBeGreaterThanOrEqual(117 + 153);
    });

    it("should include pummel damage", () => {
      const game = new SlippiGame("slp/pummel.slp");
      const stats = game.getStats()!;
      const marth = stats.overall[0]!;
      const sheik = stats.overall[1]!;
      expect(marth.totalDamage).toBeGreaterThanOrEqual(14);
      expect(sheik.totalDamage).toBeGreaterThanOrEqual(21);
    });

    it("should ignore Blast Zone Magnifying Glass damage", () => {
      const game = new SlippiGame("slp/consistencyTest/Puff-MagnifyingGlass-10.slp");
      const stats = game.getStats()!;
      const puff = stats.overall[0]!;
      const yl = stats.overall[1]!;
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
      const stats = game.getStats()!;
      const pichu = stats.overall[0]!;
      const ics = stats.overall[1]!;
      const pichuStock = stats.stocks.filter((s) => s.playerIndex === pichu.playerIndex)[0]!;
      const icsStock = stats.stocks.filter((s) => s.playerIndex === ics.playerIndex)[0]!;
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
      const stats = game.getStats()!;
      const ness = stats.overall[0]!;
      const fox = stats.overall[1]!;
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

  it("should count techs only a single time", () => {
    const game = new SlippiGame("slp/techTester.slp");
    const game2 = new SlippiGame("slp/facingDirection.slp");
    const stats = game.getStats();
    const stats2 = game2.getStats();
    expect(stats?.actionCounts[0]!.groundTechCount).toEqual({ in: 4, away: 4, neutral: 4, fail: 4 });
    // 3 of these tech aways are not facing the opponent
    expect(stats2?.actionCounts[1]!.groundTechCount).toEqual({ in: 1, away: 4, neutral: 4, fail: 11 });
    expect(stats?.actionCounts[1]!.wallTechCount).toEqual({ success: 0, fail: 0 });
  });

  it("should count peach fsmash correctly", () => {
    const game = new SlippiGame("slp/peachFsmash.slp");
    const stats = game.getStats();
    const p1Fsmashes = stats?.actionCounts[0]!.attackCount.fsmash;
    expect(p1Fsmashes).toBe(4);
  });

  it("should count wavedashes correctly", () => {
    const game1 = new SlippiGame("slp/wavedash-1.slp");
    const game2 = new SlippiGame("slp/wavedash-2.slp");
    const game3 = new SlippiGame("slp/wavedash-3.slp");
    const stats1 = game1.getStats();
    const stats2 = game2.getStats();
    const stats3 = game3.getStats();
    const g1p2Wavedashes = stats1?.actionCounts[1]!.wavedashCount;
    const g1p2Wavelands = stats1?.actionCounts[1]!.wavelandCount;
    expect(g1p2Wavedashes).toBe(5);
    expect(g1p2Wavelands).toBe(0);
    const g2p1Wavedashes = stats2?.actionCounts[0]!.wavedashCount;
    const g2p1Wavelands = stats2?.actionCounts[0]!.wavelandCount;
    expect(g2p1Wavedashes).toBe(5);
    expect(g2p1Wavelands).toBe(0);
    const g3p2Wavedashes = stats3?.actionCounts[1]!.wavedashCount;
    const g3p2Wavelands = stats3?.actionCounts[1]!.wavelandCount;
    expect(g3p2Wavedashes).toBe(5);
    expect(g3p2Wavelands).toBe(0);
  });

  it("should cound wavelands correctly", () => {
    const game1 = new SlippiGame("slp/waveland-1.slp");
    const game2 = new SlippiGame("slp/waveland-2.slp");
    const stats1 = game1.getStats();
    const stats2 = game2.getStats();
    const g1p2Wavelands = stats1?.actionCounts[1]!.wavelandCount;
    const g1p2Wavedashes = stats1?.actionCounts[1]!.wavedashCount;
    const g2p1Wavelands = stats2?.actionCounts[0]!.wavelandCount;
    const g2p1Wavedashes = stats2?.actionCounts[0]!.wavedashCount;
    expect(g1p2Wavelands).toBe(5);
    expect(g1p2Wavedashes).toBe(0);
    expect(g2p1Wavelands).toBe(5);
    expect(g2p1Wavedashes).toBe(0);
  });
});

describe("when calculating stock information", () => {
  it("should handle invalid values", () => {
    expect(didLoseStock(undefined as any, undefined as any)).toEqual(false);
    expect(
      didLoseStock({ stocksRemaining: null } as unknown as PostFrameUpdateType, {} as unknown as PostFrameUpdateType),
    ).toEqual(false);
  });
});
