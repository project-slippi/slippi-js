import _ from "lodash";
import { FrameEntryType, FramesType, PostFrameUpdateType } from "../types";
import { MoveLandedType, ConversionType, PlayerIndexedType } from "./common";
import { isDamaged, isGrabbed, calcDamageTaken, isInControl, didLoseStock, Timers } from "./common";
import { PlayerInput } from "./inputs";
import { StatComputer } from "./stats";

interface PlayerConversionState {
  conversion: ConversionType | null;
  move: MoveLandedType | null;
  resetCounter: number;
  lastHitAnimation: number | null;
}

interface MetadataType {
  lastEndFrameByOppIdx: {
    [oppIdx: number]: number;
  };
}

export class ConversionComputer implements StatComputer<ConversionType[]> {
  private playerPermutations = new Array<PlayerIndexedType>();
  private conversions = new Array<ConversionType>();
  private state = new Map<PlayerIndexedType, PlayerConversionState>();
  private metadata: MetadataType;

  public constructor() {
    this.metadata = {
      lastEndFrameByOppIdx: {},
    };
  }

  public setPlayerPermutations(playerPermutations: PlayerIndexedType[]): void {
    this.playerPermutations = playerPermutations;
    this.playerPermutations.forEach((indices) => {
      const playerState: PlayerConversionState = {
        conversion: null,
        move: null,
        resetCounter: 0,
        lastHitAnimation: null,
      };
      this.state.set(indices, playerState);
    });
  }

  public processFrame(frame: FrameEntryType, allFrames: FramesType): void {
    this.playerPermutations.forEach((indices) => {
      const state = this.state.get(indices);
      if (state) {
        handleConversionCompute(allFrames, state, indices, frame, this.conversions);
      }
    });
  }

  public fetch(): ConversionType[] {
    this._populateConversionTypes();
    return this.conversions;
  }

  private _populateConversionTypes(): void {
    // Post-processing step: set the openingTypes
    const conversionsToHandle = _.filter(this.conversions, (conversion) => {
      return conversion.openingType === "unknown";
    });

    // Group new conversions by startTime and sort
    const sortedConversions: ConversionType[][] = _.chain(conversionsToHandle)
      .groupBy("startFrame")
      .orderBy((conversions) => _.get(conversions, [0, "startFrame"]))
      .value();

    // Set the opening types on the conversions we need to handle
    sortedConversions.forEach((conversions) => {
      const isTrade = conversions.length >= 2;
      conversions.forEach((conversion) => {
        // Set end frame for this conversion
        this.metadata.lastEndFrameByOppIdx[conversion.playerIndex] = conversion.endFrame!;

        if (isTrade) {
          // If trade, just short-circuit
          conversion.openingType = "trade";
          return;
        }

        // If not trade, check the opponent endFrame
        const oppEndFrame = this.metadata.lastEndFrameByOppIdx[conversion.opponentIndex[0]];
        const isCounterAttack = oppEndFrame && oppEndFrame > conversion.startFrame;
        conversion.openingType = isCounterAttack ? "counter-attack" : "neutral-win";
      });
    });
  }
}

function handleConversionCompute(
  frames: FramesType,
  state: PlayerConversionState,
  indices: PlayerIndexedType,
  frame: FrameEntryType,
  conversions: ConversionType[],
): void {
  const currentFrameNumber = frame.frame;
  const playerFrame: PostFrameUpdateType = frame.players[indices.playerIndex]!.post;

  const prevFrameNumber = currentFrameNumber - 1;
  let prevPlayerFrame: PostFrameUpdateType | null = null;
  let prevOpponentFrame: PostFrameUpdateType | null = null;

  if (frames[prevFrameNumber]) {
    prevPlayerFrame = frames[prevFrameNumber].players[indices.playerIndex]!.post;
  }

  // Keep track of whether actionState changes after a hit. Used to compute move count
  // When purely using action state there was a bug where if you did two of the same
  // move really fast (such as ganon's jab), it would count as one move. Added
  // the actionStateCounter at this point which counts the number of frames since
  // an animation started. Should be more robust, for old files it should always be
  // null and null < null = false
  const actionChangedSinceHit = playerFrame.actionStateId !== state.lastHitAnimation;
  const actionCounter = playerFrame.actionStateCounter!;
  const prevActionCounter = prevPlayerFrame ? prevPlayerFrame.actionStateCounter! : 0;
  const actionFrameCounterReset = actionCounter < prevActionCounter;
  if (actionChangedSinceHit || actionFrameCounterReset) {
    state.lastHitAnimation = null;
  }

  _.forEach(indices.opponentIndex, (opponentIndex) => {
    if (opponentIndex === undefined) {
      return;
    }
    const opponentFrame = frame.players[opponentIndex]!.post;
    if (frames[prevFrameNumber]) {
      prevOpponentFrame = frames[prevFrameNumber].players[opponentIndex]!.post;
    }

    const oppActionStateId = opponentFrame.actionStateId!;
    const opntIsDamaged = isDamaged(oppActionStateId);
    const opntIsGrabbed = isGrabbed(oppActionStateId);
    const opntDamageTaken = prevOpponentFrame ? calcDamageTaken(opponentFrame, prevOpponentFrame) : 0;

    // If opponent took damage and was put in some kind of stun this frame, either
    // start a conversion or
    if (opntIsDamaged || opntIsGrabbed) {
      if (!state.conversion) {
        state.conversion = {
          playerIndex: indices.playerIndex,
          opponentIndex: [opponentIndex],
          startFrame: currentFrameNumber,
          endFrame: null,
          startPercent: prevOpponentFrame ? prevOpponentFrame.percent ?? 0 : 0,
          currentPercent: opponentFrame.percent ?? 0,
          endPercent: null,
          moves: [],
          didKill: false,
          openingType: "unknown", // Will be updated later
        };

        conversions.push(state.conversion);
      }

      if (opntDamageTaken) {
        // If animation of last hit has been cleared that means this is a new move. This
        // prevents counting multiple hits from the same move such as fox's drill
        if (state.lastHitAnimation === null) {
          state.move = {
            frame: currentFrameNumber,
            moveId: playerFrame.lastAttackLanded!,
            hitCount: 0,
            damage: 0,
          };

          state.conversion.moves.push(state.move);
        }

        if (state.move) {
          state.move.hitCount += 1;
          state.move.damage += opntDamageTaken;
        }

        // Store previous frame animation to consider the case of a trade, the previous
        // frame should always be the move that actually connected... I hope
        state.lastHitAnimation = prevPlayerFrame ? prevPlayerFrame.actionStateId : null;
      }
    }

    if (!state.conversion || state.conversion.opponentIndex[0] !== opponentIndex) {
      // The rest of the function handles conversion termination logic, so if we don't
      // have a conversion started, there is no need to continue
      return;
    }

    const opntInControl = isInControl(oppActionStateId);
    const opntDidLoseStock = prevOpponentFrame && didLoseStock(opponentFrame, prevOpponentFrame);

    // Update percent if opponent didn't lose stock
    if (!opntDidLoseStock) {
      state.conversion.currentPercent = opponentFrame.percent ?? 0;
    }

    if (opntIsDamaged || opntIsGrabbed) {
      // If opponent got grabbed or damaged, reset the reset counter
      state.resetCounter = 0;
    }

    const shouldStartResetCounter = state.resetCounter === 0 && opntInControl;
    const shouldContinueResetCounter = state.resetCounter > 0;
    if (shouldStartResetCounter || shouldContinueResetCounter) {
      // This will increment the reset timer under the following conditions:
      // 1) if we were punishing opponent but they have now entered an actionable state
      // 2) if counter has already started counting meaning opponent has entered actionable state
      state.resetCounter += 1;
    }

    let shouldTerminate = false;

    // Termination condition 1 - player kills opponent
    if (opntDidLoseStock) {
      state.conversion.didKill = true;
      shouldTerminate = true;
    }

    // Termination condition 2 - conversion resets on time
    if (state.resetCounter > Timers.PUNISH_RESET_FRAMES) {
      shouldTerminate = true;
    }

    // If conversion should terminate, mark the end states and add it to list
    if (shouldTerminate) {
      state.conversion.endFrame = playerFrame.frame;
      state.conversion.endPercent = prevOpponentFrame ? prevOpponentFrame.percent ?? 0 : 0;

      state.conversion = null;
      state.move = null;
    }
  });
}
