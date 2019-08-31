// @flow
import * as _ from 'lodash';
import SlippiGame from "../index";
import { iterateFramesInOrder, isDead, didLoseStock } from "./common";

import { StockType } from "./common";
import { PostFrameUpdateType } from "../utils/slpReader";

export function generateStocks(game: SlippiGame): StockType[] {
  const stocks: Array<StockType> = [];
  const frames = game.getFrames();

  const initialState: {
    stock: StockType | null | undefined;
  } = {
    stock: null
  };

  let state = initialState;

  // Iterates the frames in order in order to compute stocks
  iterateFramesInOrder(game, () => {
    state = { ...initialState };
  }, (indices, frame) => {
    const playerFrame = frame.players[indices.playerIndex].post;
    // FIXME: use PostFrameUpdateType instead of any
    const prevPlayerFrame: any = _.get(
      frames, [playerFrame.frame - 1, 'players', indices.playerIndex, 'post'], {}
    );

    // If there is currently no active stock, wait until the player is no longer spawning.
    // Once the player is no longer spawning, start the stock
    if (!state.stock) {
      const isPlayerDead = isDead(playerFrame.actionStateId);
      if (isPlayerDead) {
        return;
      }

      state.stock = {
        playerIndex: indices.playerIndex,
        opponentIndex: indices.opponentIndex,
        startFrame: playerFrame.frame,
        endFrame: null,
        startPercent: 0,
        endPercent: null,
        currentPercent: 0,
        count: playerFrame.stocksRemaining,
        deathAnimation: null,
      };

      stocks.push(state.stock);
    } else if (didLoseStock(playerFrame, prevPlayerFrame)) {
      state.stock.endFrame = playerFrame.frame;
      state.stock.endPercent = prevPlayerFrame.percent || 0;
      state.stock.deathAnimation = playerFrame.actionStateId;
      state.stock = null;
    } else {
      state.stock.currentPercent = playerFrame.percent || 0;
    }
  });

  return stocks;
}
