// @flow
import _ from 'lodash';
import { SlippiGame, FrameEntryType, FramesType } from "../SlippiGame";
import { iterateFramesInOrder, isDead, didLoseStock, PlayerIndexedType } from "./common";

import { StockType } from "./common";


import { StatComputer } from './stats';

interface StockState {
  stock: StockType | null | undefined;
}

export class StockComputer implements StatComputer<Array<StockType>> {
  private opponentIndices: PlayerIndexedType[];
  private state: Map<PlayerIndexedType, StockState>;
  private stocks: Array<StockType> = [];
  private frames: FramesType = {};

  public constructor(opponentIndices: PlayerIndexedType[]) {
    this.opponentIndices = opponentIndices;
    this.state = new Map<PlayerIndexedType, StockState>();

    this.opponentIndices.forEach((indices) => {
      const playerState: StockState = {
        stock: null,
      };

      this.state.set(indices, playerState);
    })
  }

  public processFrame(frame: FrameEntryType): void {
    this.frames[frame.frame] = frame;
    this.opponentIndices.forEach((indices) => {
      const state = this.state.get(indices);
      handleStockCompute(this.frames, state, indices, frame, this.stocks);
    });
  }

  public fetch(): Array<StockType> {
    return this.stocks;
  }

}

function handleStockCompute(frames: FramesType, state: StockState, indices: PlayerIndexedType, frame: FrameEntryType, stocks: Array<StockType>): void {
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
}

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
    handleStockCompute(frames, state, indices, frame, stocks);
  });

  return stocks;
}
