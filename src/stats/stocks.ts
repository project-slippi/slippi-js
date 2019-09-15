// @flow
import _ from 'lodash';
import { SlippiGame } from "../SlippiGame";
import { iterateFramesInOrder, isDead, didLoseStock } from "./common";

import { StockType } from "./common";

type State = {
  stock: StockType | null | undefined;
};

type Result = StockType[];

export function generateStocks(game: SlippiGame): StockType[] {
  // TODO: getFrames calls still do some stupid file operations when sometimes
  // TODO: they probably don't have to. Figure out something to do about this
  const frames = game.getFrames();

  const initialState: State = {
    stock: null
  };

  // Iterates the frames in order in order to compute stocks
  const output = iterateFramesInOrder(game, 'stocks', () => {
    return initialState;
  }, (indices, frame, state, result) => {
    // TODO: Probably shouldn't do so much direct object mutation?
    state as State;
    result as Result;

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

      result.push(state.stock);
    } else if (didLoseStock(playerFrame, prevPlayerFrame)) {
      state.stock.endFrame = playerFrame.frame;
      state.stock.endPercent = prevPlayerFrame.percent || 0;
      state.stock.deathAnimation = playerFrame.actionStateId;
      state.stock = null;
    } else {
      state.stock.currentPercent = playerFrame.percent || 0;
    }
  });

  // TODO: TypeScript not happy with this type conversion, figure that out
  return output;
}
