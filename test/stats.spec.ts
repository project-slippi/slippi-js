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
  it("accounts for Blast Zone Magnifying Glass", () => {
    const game = new SlippiGame("slp/consistencyTest/Puff-MagnifyingGlass-10.slp");
    const stats = game.getStats();
    const puff = stats.overall[0]
    let totalDamagePuffDealt = 0
    stats.conversions.forEach( conversion => {
      if(conversion.playerIndex === puff.playerIndex ){
        totalDamagePuffDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
      }
    })
    expect(totalDamagePuffDealt).toBe(puff.totalDamage);
    expect(puff.killCount).toBe(0);
    expect(puff.conversionCount).toBe(0);
  });
  it("accounts for Pichu Self Harm", () => {
    const game = new SlippiGame("slp/consistencyTest/PichuVSelf-All-22.slp");
    const stats = game.getStats();
    const pichu = stats.overall[0]
    let totalDamagePichuDealt = 0
    stats.conversions.forEach( conversion => {
      if(conversion.playerIndex === pichu.playerIndex ){
        totalDamagePichuDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
      }
    })
    expect(totalDamagePichuDealt).toBe(pichu.totalDamage);
    expect(pichu.killCount).toBe(0);
    expect(pichu.conversionCount).toBe(3);
  });
  it("accounts for Puff's Sing", () => {
    const game = new SlippiGame("slp/consistencyTest/PuffVFalcon-Sing.slp");
    const stats = game.getStats();
    const puff = stats.overall[0]
    let totalDamagePuffDealt = 0
    stats.conversions.forEach( conversion => {
      if(conversion.playerIndex === puff.playerIndex ){
        totalDamagePuffDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
      }
    })
    expect(totalDamagePuffDealt).toBe(puff.totalDamage);
    expect(puff.killCount).toBe(0);
    expect(puff.conversionCount).toBe(2);
  });
  it("accounts for Ness's Recover", () => {
    const game = new SlippiGame("slp/consistencyTest/NessVFox-Absorb.slp");
    const stats = game.getStats();
    const ness = stats.overall[0]
    const fox = stats.overall[1]
    let totalDamageNessDealt = 0
    let totalDamageFoxDealt = 0
    stats.conversions.forEach( conversion => {
      if(conversion.playerIndex === ness.playerIndex ){
        totalDamageNessDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
      }
      if(conversion.playerIndex === fox.playerIndex ){
        totalDamageFoxDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
      }
    })
    expect(totalDamageNessDealt).toBe(ness.totalDamage);
    expect(ness.killCount).toBe(0);
    expect(ness.conversionCount).toBe(0);

    expect(totalDamageFoxDealt).toBe(fox.totalDamage);
    expect(fox.killCount).toBe(0);
    expect(fox.conversionCount).toBe(2);
  });
  describe("When Handling Command Grabs", () => {
    it("accounts for Bowser's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/BowsVDK-SB-63.slp");
      const stats = game.getStats();
      const bowser = stats.overall[0]
      let totalDamageBowserDealt = 0
      stats.conversions.forEach( conversion => {
        if(conversion.playerIndex === bowser.playerIndex ){
          totalDamageBowserDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(totalDamageBowserDealt).toBe(bowser.totalDamage);
      expect(bowser.killCount).toBe(0);
      expect(bowser.conversionCount).toBe(3);
    });
    it("accounts for Falcon's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/FalcVBows-5UB-67.slp");
      const stats = game.getStats();
      const falcon = stats.overall[0]
      let totalDamageFalconDealt = 0
      stats.conversions.forEach( conversion => {
        if(conversion.playerIndex === falcon.playerIndex ){
          totalDamageFalconDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(totalDamageFalconDealt).toBe(falcon.totalDamage);
      expect(falcon.killCount).toBe(0);
      expect(falcon.conversionCount).toBe(3);
    });
    it("accounts for Ganon's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/GanonVDK-5UB-73.slp");
      const stats = game.getStats();
      const ganon = stats.overall[0]
      let totalDamageGanonDealt = 0
      stats.conversions.forEach( conversion => {
        if(conversion.playerIndex === ganon.playerIndex ){
          totalDamageGanonDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(totalDamageGanonDealt).toBe(ganon.totalDamage);
      expect(ganon.killCount).toBe(0);
      expect(ganon.conversionCount).toBe(5);
    });
    it("accounts for Kirby's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/KirbyVDK-Neutral-17.slp");
      const stats = game.getStats();
      const kirby = stats.overall[0]
      let totalDamageKirbyDealt = 0
      stats.conversions.forEach( conversion => {
        if(conversion.playerIndex === kirby.playerIndex ){
          totalDamageKirbyDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(totalDamageKirbyDealt).toBe(kirby.totalDamage);
      expect(kirby.killCount).toBe(0);
      expect(kirby.conversionCount).toBe(3);
    });
    it("accounts for Yoshi's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/YoshiVDK-Egg-13.slp");
      const stats = game.getStats();
      const yoshi = stats.overall[0]
      let totalDamageYoshiDealt = 0
      stats.conversions.forEach( conversion => {
        if(conversion.playerIndex === yoshi.playerIndex ){
          totalDamageYoshiDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(totalDamageYoshiDealt).toBe(yoshi.totalDamage);
      expect(yoshi.killCount).toBe(0);
      expect(yoshi.conversionCount).toBe(2);
    });
    it("accounts for MewTwo's Command Grab", () => {
      const game = new SlippiGame("slp/consistencyTest/MewTwoVDK-SB-42.slp");
      const stats = game.getStats();
      const mewTwo = stats.overall[0]
      let totalDamageMewTwoDealt = 0
      stats.conversions.forEach( conversion => {
        if(conversion.playerIndex === mewTwo.playerIndex ){
          totalDamageMewTwoDealt += conversion.moves.reduce((total, move) => total + move.damage, 0)
        }
      })
      expect(totalDamageMewTwoDealt).toBe(mewTwo.totalDamage);
      expect(mewTwo.killCount).toBe(0);
      expect(mewTwo.conversionCount).toBe(1);
    });
    
  });
});
