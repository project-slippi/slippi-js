// @flow
import _ from 'lodash';
import { isDead, didLoseStock, Frames } from "./common";

import { StockType, PlayerIndexedType, ProcessorType } from "./common";
import { FrameEntryType, FramesType } from "../SlippiGame";
import { PostFrameUpdateType } from "../utils/slpReader";

type StateType = {
  stock: StockType | null | undefined;
};

type ResultType = StockType[];

export function getStocksProcessor(indices: PlayerIndexedType): ProcessorType {
  let frameIndex = Frames.FIRST;
  const result: ResultType = [];
  const state: StateType = {
    stock: null,
  };

  const processFrame = (frame: FrameEntryType, framesByIndex: FramesType) => {
    const playerFrame = frame.players[indices.playerIndex].post;
    const prevPlayerFrame: PostFrameUpdateType = _.get(
      framesByIndex, [playerFrame.frame - 1, 'players', indices.playerIndex, 'post'], {}
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
  };

  return {
    processFrame: processFrame,
    getFrameIndex: () => frameIndex,
    incrementFrameIndex: () => frameIndex++,
    getResult: () => result,
    getIndices: () => indices,
  };
}
