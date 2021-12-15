import { log } from "console";
import { getMoveName } from "../src/melee/moves";
import { SlippiGame } from "../src/SlippiGame";

describe("when calculating stats", () => {
  it("the correct move ids should be determined", () => {
    let game = new SlippiGame("slp/moveTest/id_0.slp");
    let stats = game.getStats();

    stats.conversions.forEach((c) => {
      c.moves.forEach((m) => {
        expect(m.moveId).toEqual(0);
      });
    });

    let moveIdCounter = 2;
    game = new SlippiGame("slp/moveTest/id_2_to_21.slp");
    stats = game.getStats();

    stats.conversions.forEach((c) => {
      c.moves.forEach((m) => {
        expect(m.moveId).toEqual(moveIdCounter);
        moveIdCounter++;
      });
    });

    // Kirby-Mario
    game = new SlippiGame("slp/moveTest/id_22.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Lasers cause no hitstun and do not register as combo or conversion starters
    // As such, this test case should be adjusted to not rely on those
    // Kirby-Fox
    game = new SlippiGame("slp/moveTest/id_23.slp");
    stats = game.getStats();
    //expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-CaptainFalcon
    game = new SlippiGame("slp/moveTest/id_24.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-DK
    game = new SlippiGame("slp/moveTest/id_25.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Bowser
    game = new SlippiGame("slp/moveTest/id_26.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Link
    game = new SlippiGame("slp/moveTest/id_27.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Sheik
    game = new SlippiGame("slp/moveTest/id_28.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Ness
    game = new SlippiGame("slp/moveTest/id_29.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Peach
    game = new SlippiGame("slp/moveTest/id_30.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-IceClimbers
    game = new SlippiGame("slp/moveTest/id_31.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Pikachu
    game = new SlippiGame("slp/moveTest/id_32.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Samus
    game = new SlippiGame("slp/moveTest/id_33.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Yoshi
    // Unused - Kirby-Yoshi's Neutral Special's id is the same as a normal Neutral Special (18)
    moveIdCounter++;

    // Kirby-Jigglypuff
    game = new SlippiGame("slp/moveTest/id_35.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Mewtwo
    game = new SlippiGame("slp/moveTest/id_36.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Luigi
    game = new SlippiGame("slp/moveTest/id_37.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Marth
    game = new SlippiGame("slp/moveTest/id_38.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Zelda
    game = new SlippiGame("slp/moveTest/id_39.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-YoungLink
    game = new SlippiGame("slp/moveTest/id_40.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-DrMario
    game = new SlippiGame("slp/moveTest/id_41.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Falco
    game = new SlippiGame("slp/moveTest/id_42.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Pichu
    game = new SlippiGame("slp/moveTest/id_43.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Game&Watch
    game = new SlippiGame("slp/moveTest/id_44.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Ganondorf
    game = new SlippiGame("slp/moveTest/id_45.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;

    // Kirby-Roy
    game = new SlippiGame("slp/moveTest/id_46.slp");
    stats = game.getStats();
    expect(stats.conversions[1].moves[0].moveId).toEqual(moveIdCounter);
    moveIdCounter++;
  });
});
