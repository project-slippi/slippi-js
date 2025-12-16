import type { FrameEntryType, FramesType, GameStartType } from "../types";
import type { PlayerIndexedType, StockType } from "./common";
import { didLoseStock, getSinglesPlayerPermutationsFromSettings, isDead } from "./common";
import type { StatComputer } from "./stats";

type StockState = {
  stock: StockType | undefined;
};

export class StockComputer implements StatComputer<StockType[]> {
  private state = new Map<PlayerIndexedType, StockState>();
  private playerPermutations: PlayerIndexedType[] = [];
  private stocks: StockType[] = [];

  public setup(settings: GameStartType): void {
    // Reset state
    this.state = new Map();
    this.playerPermutations = getSinglesPlayerPermutationsFromSettings(settings);
    this.stocks = [];

    this.playerPermutations.forEach((indices) => {
      const playerState: StockState = {
        stock: undefined,
      };
      this.state.set(indices, playerState);
    });
  }

  public processFrame(frame: FrameEntryType, allFrames: FramesType): void {
    this.playerPermutations.forEach((indices) => {
      const state = this.state.get(indices);
      if (state) {
        handleStockCompute(allFrames, state, indices, frame, this.stocks);
      }
    });
  }

  public fetch(): StockType[] {
    return this.stocks;
  }
}

function handleStockCompute(
  frames: FramesType,
  state: StockState,
  indices: PlayerIndexedType,
  frame: FrameEntryType,
  stocks: StockType[],
): void {
  const playerFrame = frame.players[indices.playerIndex]!.post;
  const currentFrameNumber = playerFrame.frame!;
  const prevFrameNumber = currentFrameNumber - 1;
  const prevPlayerFrame = frames[prevFrameNumber]
    ? frames[prevFrameNumber]!.players[indices.playerIndex]!.post
    : undefined;

  // If there is currently no active stock, wait until the player is no longer spawning.
  // Once the player is no longer spawning, start the stock
  if (!state.stock) {
    const isPlayerDead = isDead(playerFrame.actionStateId!);
    if (isPlayerDead) {
      return;
    }

    state.stock = {
      playerIndex: indices.playerIndex,
      startFrame: currentFrameNumber,
      endFrame: undefined,
      startPercent: 0,
      endPercent: undefined,
      currentPercent: 0,
      count: playerFrame.stocksRemaining!,
      deathAnimation: undefined,
    };

    stocks.push(state.stock);
  } else if (prevPlayerFrame && didLoseStock(playerFrame, prevPlayerFrame)) {
    state.stock.endFrame = playerFrame.frame;
    state.stock.endPercent = prevPlayerFrame.percent ?? 0;
    state.stock.deathAnimation = playerFrame.actionStateId;
    state.stock = undefined;
  } else {
    state.stock.currentPercent = playerFrame.percent ?? 0;
  }
}
