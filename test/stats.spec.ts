import { SlippiGame } from "../src";

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
  describe("When Handling Command Grabs", () => {
    it("accounts for Bowser's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/BowsVDK-SB-63.slp");
      const stats = game.getStats();
      const bowser = stats.overall[0]
      let totalDamageBowserDealt = 0
      stats.conversions.map( conversion => {
        if(conversion.playerIndex === bowser.playerIndex ){
          totalDamageBowserDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(bowser.killCount).toBe(0);
      expect(bowser.conversionCount).toBe(3);
      expect(bowser.totalDamage).toBe(totalDamageBowserDealt);
    });
    it("accounts for Falcon's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/FalcVBows-5UB-67.slp");
      const stats = game.getStats();
      const falcon = stats.overall[0]
      let totalDamageFalconDealt = 0
      stats.conversions.map( conversion => {
        if(conversion.playerIndex === falcon.playerIndex ){
          totalDamageFalconDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(falcon.killCount).toBe(0);
      expect(falcon.conversionCount).toBe(4);
      expect(falcon.totalDamage).toBe(totalDamageFalconDealt);
    });
    it("accounts for Ganon's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/GanonVDK-5UB-73.slp");
      const stats = game.getStats();
      const ganon = stats.overall[0]
      let totalDamageGanonDealt = 0
      stats.conversions.map( conversion => {
        if(conversion.playerIndex === ganon.playerIndex ){
          totalDamageGanonDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(ganon.killCount).toBe(0);
      expect(ganon.conversionCount).toBe(5);
      expect(ganon.totalDamage).toBe(totalDamageGanonDealt);
    });
    it("accounts for Kirby's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/KirbyVDK-Neutral-17.slp");
      const stats = game.getStats();
      const kirby = stats.overall[0]
      let totalDamageKirbyDealt = 0
      stats.conversions.map( conversion => {
        if(conversion.playerIndex === kirby.playerIndex ){
          totalDamageKirbyDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(kirby.killCount).toBe(0);
      expect(kirby.conversionCount).toBe(1);
      expect(kirby.totalDamage).toBe(totalDamageKirbyDealt);
    });
    it("accounts for Yoshi's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/YoshiVDK-Egg-13.slp");
      const stats = game.getStats();
      const yoshi = stats.overall[0]
      let totalDamageYoshiDealt = 0
      stats.conversions.map( conversion => {
        if(conversion.playerIndex === yoshi.playerIndex ){
          totalDamageYoshiDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(yoshi.killCount).toBe(0);
      expect(yoshi.conversionCount).toBe(0);
      expect(yoshi.totalDamage).toBe(totalDamageYoshiDealt);
    });
  }
});
