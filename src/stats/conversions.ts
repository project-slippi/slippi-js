import { EventEmitter } from "events";
import filter from "lodash/filter";
import get from "lodash/get";
import groupBy from "lodash/groupBy";
import last from "lodash/last";
import orderBy from "lodash/orderBy";

import type { FrameEntryType, FramesType, GameStartType, PostFrameUpdateType } from "../types";
import type { ConversionType, MoveLandedType, PlayerIndexedType } from "./common";
import {
  calcDamageTaken,
  didLoseStock,
  getSinglesPlayerPermutationsFromSettings,
  isCommandGrabbed,
  isDamaged,
  isGrabbed,
  isInControl,
  Timers,
} from "./common";
import type { StatComputer } from "./stats";

type PlayerConversionState = {
  conversion: ConversionType | null;
  move: MoveLandedType | null;
  resetCounter: number;
  lastHitAnimation: number | null;
};

type MetadataType = {
  lastEndFrameByOppIdx: {
    [oppIdx: number]: number;
  };
};

export class ConversionComputer extends EventEmitter implements StatComputer<ConversionType[]> {
  private playerPermutations = new Array<PlayerIndexedType>();
  private conversions = new Array<ConversionType>();
  private state = new Map<PlayerIndexedType, PlayerConversionState>();
  private metadata: MetadataType;
  private settings: GameStartType | null = null;

  public constructor() {
    super();
    this.metadata = {
      lastEndFrameByOppIdx: {},
    };
  }

  public setup(settings: GameStartType): void {
    // Reset the state
    this.playerPermutations = getSinglesPlayerPermutationsFromSettings(settings);
    this.conversions = [];
    this.state = new Map();
    this.metadata = {
      lastEndFrameByOppIdx: {},
    };
    this.settings = settings;

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
        const terminated = handleConversionCompute(allFrames, state, indices, frame, this.conversions);
        if (terminated) {
          this.emit("CONVERSION", {
            combo: last(this.conversions),
            settings: this.settings,
          });
        }
      }
    });
  }

  public fetch(): ConversionType[] {
    this._populateConversionTypes();
    return this.conversions;
  }

  private _populateConversionTypes(): void {
    // Post-processing step: set the openingTypes
    const conversionsToHandle = filter(this.conversions, (conversion) => {
      return conversion.openingType === "unknown";
    });

    // Group new conversions by startTime and sort
    const groupedConversions = groupBy(conversionsToHandle, "startFrame");
    const sortedConversions = orderBy(groupedConversions, (conversions) => get(conversions, [0, "startFrame"]));

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
        const lastMove = last(conversion.moves);
        const oppEndFrame =
          this.metadata.lastEndFrameByOppIdx[lastMove ? lastMove.playerIndex : conversion.playerIndex];
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
): boolean {
  const currentFrameNumber = frame.frame;
  const playerFrame: PostFrameUpdateType = frame.players[indices.playerIndex]!.post;
  const opponentFrame = frame.players[indices.opponentIndex]!.post;

  const prevFrameNumber = currentFrameNumber - 1;
  let prevPlayerFrame: PostFrameUpdateType | null = null;
  let prevOpponentFrame: PostFrameUpdateType | null = null;

  if (frames[prevFrameNumber]) {
    prevPlayerFrame = frames[prevFrameNumber]!.players[indices.playerIndex]!.post;
    prevOpponentFrame = frames[prevFrameNumber]!.players[indices.opponentIndex]!.post;
  }

  const oppActionStateId = opponentFrame.actionStateId!;
  const opntIsDamaged = isDamaged(oppActionStateId);
  const opntIsGrabbed = isGrabbed(oppActionStateId);
  const opntIsCommandGrabbed = isCommandGrabbed(oppActionStateId);
  const opntDamageTaken = prevOpponentFrame ? calcDamageTaken(opponentFrame, prevOpponentFrame) : 0;

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

  // If opponent took damage and was put in some kind of stun this frame, either
  // start a conversion or
  if (opntIsDamaged || opntIsGrabbed || opntIsCommandGrabbed) {
    if (!state.conversion) {
      state.conversion = {
        playerIndex: indices.opponentIndex,
        lastHitBy: indices.playerIndex,
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
          playerIndex: indices.playerIndex,
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

  if (!state.conversion) {
    // The rest of the function handles conversion termination logic, so if we don't
    // have a conversion started, there is no need to continue
    return false;
  }

  const opntInControl = isInControl(oppActionStateId);
  const opntDidLoseStock = prevOpponentFrame && didLoseStock(opponentFrame, prevOpponentFrame);

  // Update percent if opponent didn't lose stock
  if (!opntDidLoseStock) {
    state.conversion.currentPercent = opponentFrame.percent ?? 0;
  }

  if (opntIsDamaged || opntIsGrabbed || opntIsCommandGrabbed) {
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

  return shouldTerminate;
}
