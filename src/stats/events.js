// @flow
import _ from 'lodash';
import SlippiGame from "../index";
import type { PostFrameUpdateType } from "../utils/slpReader";
import type { FrameEntryType } from "../index";

type PlayerIndexedType = {
  playerIndex: number,
  opponentIndex: number
}

export type DurationType = {
  startFrame: number,
  endFrame: ?number
}

export type DamageType = {
  startPercent: number,
  currentPercent: number,
  endPercent: ?number
}

export type StockType = PlayerIndexedType & DurationType & DamageType & {
  count: number,
  deathAnimation: ?number,
};

export type ComboStringType = PlayerIndexedType & DurationType & DamageType & {
  hitCount: number
}

export type PunishType = ComboStringType & {
  openingMove: number,
  lastMove: number,
  moveCount: number,
  openingType: string,
  didKill: boolean,
}

export type ActionCountsType = PlayerIndexedType & {
  wavedashCount: number,
  wavelandCount: number,
  airDodgeCount: number,
  dashDanceCount: number,
  spotDodgeCount: number,
  rollCount: number,
}

export type EdgeguardType = PunishType;

export const States = {
  // Animation ID ranges
  DAMAGE_START: 0x4B,
  DAMAGE_END: 0x5B,
  CAPTURE_START: 0xDF,
  CAPTURE_END: 0xE8,
  GUARD_START: 0xB2,
  GUARD_END: 0xB6,
  GROUNDED_CONTROL_START: 0xE,
  GROUNDED_CONTROL_END: 0x18,
  SQUAT_START: 0x27,
  SQUAT_END: 0x29,
  TECH_START: 0xC7,
  TECH_END: 0xCC,
  DYING_START: 0x0,
  DYING_END: 0xA,
  CONTROLLED_JUMP_START: 0x18,
  CONTROLLED_JUMP_END: 0x22,

  // Animation ID specific
  ROLL_FORWARD: 0xE9,
  ROLL_BACKWARD: 0xEA,
  SPOT_DODGE: 0xEB,
  AIR_DODGE: 0xEC,
  ACTION_WAIT: 0xE,
  ACTION_DASH: 0x14,
  ACTION_KNEE_BEND: 0x18,
  GUARD_ON: 0xB2,
  TECH_MISS_UP: 0xB7,
  TECH_MISS_DOWN: 0xBF,
  DASH: 0x14,
  TURN: 0x12,
  LANDING_FALL_SPECIAL: 0x2B,
  JUMP_FORWARD: 0x19,
  JUMP_BACKWARD: 0x1A,
  FALL_FORWARD: 0x1E,
  FALL_BACKWARD: 0x1F,
};

const Timers = {
  PUNISH_RESET_FRAMES: 45,
  RECOVERY_RESET_FRAMES: 45,
  COMBO_STRING_RESET_FRAMES: 45
};

function getSinglesOpponentIndices(game: SlippiGame): PlayerIndexedType[] {
  const settings = game.getSettings();
  if (settings.players.length !== 2) {
    // Only return opponent indices for singles
    return [];
  }

  return [
    {
      playerIndex: settings.players[0].playerIndex,
      opponentIndex: settings.players[1].playerIndex
    }, {
      playerIndex: settings.players[1].playerIndex,
      opponentIndex: settings.players[0].playerIndex
    }
  ];
}

function didLoseStock(frame: PostFrameUpdateType, prevFrame: PostFrameUpdateType): boolean {
  if (!frame || !prevFrame) {
    return false;
  }

  return (prevFrame.stocksRemaining - frame.stocksRemaining) > 0;
}

function isInControl(state: number): boolean {
  const ground = state >= States.GROUNDED_CONTROL_START && state <= States.GROUNDED_CONTROL_END;
  const squat = state >= States.SQUAT_START && state <= States.SQUAT_END;
  return ground || squat;
}

function isDamaged(state: number): boolean {
  return state >= States.DAMAGE_START && state <= States.DAMAGE_END;
}

function isGrabbed(state: number): boolean {
  return state >= States.CAPTURE_START && state <= States.CAPTURE_END;
}

function isDead(state: number): boolean {
  return state >= States.DYING_START && state <= States.DYING_END;
}

function calcDamageTaken(frame: PostFrameUpdateType, prevFrame: PostFrameUpdateType): number {
  const percent = _.get(frame, 'percent', 0);
  const prevPercent = _.get(prevFrame, 'percent', 0);

  return percent - prevPercent;
}

function getSortedFrames(game: SlippiGame) {
  // TODO: This is obviously jank and probably shouldn't be done this way. I just didn't
  // TODO: want the primary game object to have the concept of sortedFrames because it's
  // TODO: kinda shitty I need to do that anyway. It's required because javascript doesn't
  // TODO: support sorted objects... I could use a Map but that felt pretty heavy for
  // TODO: little reason.
  if (_.has(game, ['external', 'sortedFrames'])) {
    // $FlowFixMe
    return game.external.sortedFrames;
  }

  const frames = game.getFrames();
  const sortedFrames = _.orderBy(frames, 'frame');
  _.set(game, ['external', 'sortedFrames'], sortedFrames);

  // $FlowFixMe
  return game.external.sortedFrames;
}

function iterateFramesInOrder(
  game: SlippiGame,
  initialize: (indices: PlayerIndexedType) => void,
  processFrame: (indices: PlayerIndexedType, frame: FrameEntryType) => void
) {
  const opponentIndices = getSinglesOpponentIndices(game);
  if (opponentIndices.length === 0) {
    return;
  }

  const sortedFrames = getSortedFrames(game);

  // Iterates through both of the player/opponent pairs
  _.forEach(opponentIndices, (indices) => {
    initialize(indices);

    // Iterates through all of the frames for the current player and opponent
    _.forEach(sortedFrames, (frame) => {
      processFrame(indices, frame);
    });
  });
}

export function getLastFrame(game: SlippiGame): number {
  const sortedFrames = getSortedFrames(game);
  const lastFrame = _.last(sortedFrames);

  return lastFrame.frame;
}

export function generateStocks(game: SlippiGame): StockType[] {
  const stocks = [];
  const frames = game.getFrames();

  const initialState: {
    stock: ?StockType
  } = {
    stock: null
  };

  let state = initialState;

  // Iterates the frames in order in order to compute stocks
  iterateFramesInOrder(game, () => {
    state = { ...initialState };
  }, (indices, frame) => {
    const playerFrame = frame.players[indices.playerIndex].post;
    const prevPlayerFrame: PostFrameUpdateType = _.get(
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

export function generatePunishes(game: SlippiGame): PunishType[] {
  // TODO: Perhaps call punishes "conversions"?
  const punishes = [];
  const frames = game.getFrames();

  const initialState: {
    punish: ?PunishType,
    resetCounter: number,
    count: number,
    lastHitAnimation: ?number,
  } = {
    punish: null,
    resetCounter: 0,
    count: 0,
    lastHitAnimation: null,
  };

  // Only really doing assignment here for flow
  let state = initialState;

  // Iterates the frames in order in order to compute punishes
  iterateFramesInOrder(game, () => {
    state = { ...initialState };
  }, (indices, frame) => {
    const playerFrame: PostFrameUpdateType = frame.players[indices.playerIndex].post;
    const prevPlayerFrame: PostFrameUpdateType = _.get(
      frames, [playerFrame.frame - 1, 'players', indices.playerIndex, 'post'], {}
    );
    const opponentFrame: PostFrameUpdateType = frame.players[indices.opponentIndex].post;
    const prevOpponentFrame: PostFrameUpdateType = _.get(
      frames, [playerFrame.frame - 1, 'players', indices.opponentIndex, 'post'], {}
    );

    const opntIsDamaged = isDamaged(opponentFrame.actionStateId);
    const opntIsGrabbed = isGrabbed(opponentFrame.actionStateId);
    const opntDamageTaken = calcDamageTaken(opponentFrame, prevOpponentFrame);

    // Keep track of whether actionState changes after a hit. Used to computer move count
    if (playerFrame.actionStateId !== state.lastHitAnimation) {
      state.lastHitAnimation = null;
    }

    // If opponent took damage and was put in some kind of stun this frame, either
    // start a punish or
    if (opntDamageTaken && (opntIsDamaged || opntIsGrabbed)) {
      if (!state.punish) {
        state.punish = {
          playerIndex: indices.playerIndex,
          opponentIndex: indices.opponentIndex,
          startFrame: playerFrame.frame,
          endFrame: null,
          startPercent: prevOpponentFrame.percent || 0,
          currentPercent: opponentFrame.percent || 0,
          endPercent: null,
          hitCount: 0,
          moveCount: 0,
          lastMove: playerFrame.lastAttackLanded,
          didKill: false,
          openingMove: playerFrame.lastAttackLanded,
          openingType: "unknown", // Will be updated later
        };

        punishes.push(state.punish);
      }

      state.punish.lastMove = playerFrame.lastAttackLanded;
      state.punish.hitCount += 1;

      // If animation of last hit has been cleared that means this is a new move. This
      // prevents counting multiple hits from the same move such as fox's drill
      if (!state.lastHitAnimation) {
        state.punish.moveCount += 1;
      }

      // Store previous frame animation to consider the case of a trade, the previous
      // frame should always be the move that actually connected... I hope
      state.lastHitAnimation = prevPlayerFrame.actionStateId;
    }

    state.count += 1;

    if (!state.punish) {
      // The rest of the function handles punish termination logic, so if we don't
      // have a punish started, there is no need to continue
      return;
    }

    const opntInControl = isInControl(opponentFrame.actionStateId);
    const opntDidLoseStock = didLoseStock(opponentFrame, prevOpponentFrame);

    // Update percent if opponent didn't lose stock
    if (!opntDidLoseStock) {
      state.punish.currentPercent = opponentFrame.percent || 0;
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
      state.punish.didKill = true;
      shouldTerminate = true;
    }

    // Termination condition 2 - punish resets on time
    if (state.resetCounter > Timers.PUNISH_RESET_FRAMES) {
      shouldTerminate = true;
    }

    // If punish should terminate, mark the end states and add it to list
    if (shouldTerminate) {
      state.punish.endFrame = playerFrame.frame;
      state.punish.endPercent = prevOpponentFrame.percent || 0;

      state.punish = null;
    }
  });

  // Adds opening type to the punishes
  addOpeningTypeToPunishes(game, punishes);

  return punishes;
}

function addOpeningTypeToPunishes(game, punishes) {
  const punishesByPlayerIndex = _.groupBy(punishes, 'playerIndex');
  const keyedPunishes = _.mapValues(punishesByPlayerIndex, (playerPunishes) => (
    _.keyBy(playerPunishes, 'startFrame')
  ));

  const initialState: {
    opponentPunish: ?PunishType,
  } = {
    opponentPunish: null
  };

  // Only really doing assignment here for flow
  let state = initialState;

  // console.log(punishesByPlayerIndex);

  // Iterates the frames in order in order to compute punishes
  iterateFramesInOrder(game, () => {
    state = { ...initialState };
  }, (indices, frame) => {
    const frameNum = frame.frame;

    // Clear opponent punish if it ended this frame
    if (_.get(state, ['opponentPunish', 'endFrame']) === frameNum) {
      state.opponentPunish = null;
    }

    // Get opponent punish. Add to state if exists for this frame
    const opponentPunish = _.get(keyedPunishes, [indices.opponentIndex, frameNum]);
    if (opponentPunish) {
      state.opponentPunish = opponentPunish;
    }

    const playerPunish = _.get(keyedPunishes, [indices.playerIndex, frameNum]);
    if (!playerPunish) {
      // Only need to do something if a punish for this player started on this frame
      return;
    }

    // In the case where punishes from both players start on the same frame, set trade
    if (playerPunish && opponentPunish) {
      playerPunish.openingType = "trade";
      return;
    }

    // TODO: Handle this in a better way. It probably shouldn't be considered a neutral
    // TODO: win in the case where a player attacks into a crouch cancel and gets
    // TODO: countered on.

    // If opponent has an active punish, this is a counter-attack, otherwise a neutral win
    playerPunish.openingType = state.opponentPunish ? "counter-attack" : "neutral-win";
  });
}

function isRolling(animation) {
  const rollAnimations = {
    [States.ROLL_BACKWARD]: true,
    [States.ROLL_FORWARD]: true,
  };

  return rollAnimations[animation];
}

function didStartRoll(currentAnimation, previousAnimation) {
  const isCurrentlyRolling = isRolling(currentAnimation);
  const wasPreviouslyRolling = isRolling(previousAnimation);

  return isCurrentlyRolling && !wasPreviouslyRolling;
}

function isSpotDodging(animation) {
  return animation === States.SPOT_DODGE;
}

function didStartSpotDodge(currentAnimation, previousAnimation) {
  const isCurrentlyDodging = isSpotDodging(currentAnimation);
  const wasPreviouslyDodging = isSpotDodging(previousAnimation);

  return isCurrentlyDodging && !wasPreviouslyDodging;
}

function isAirDodging(animation) {
  return animation === States.AIR_DODGE;
}

function didStartAirDodge(currentAnimation, previousAnimation) {
  const isCurrentlyDodging = isAirDodging(currentAnimation);
  const wasPreviouslyDodging = isAirDodging(previousAnimation);

  return isCurrentlyDodging && !wasPreviouslyDodging;
}

export function generateActionCounts(game: SlippiGame): ActionCountsType[] {
  const actionCounts = [];

  // Frame pattern that indicates a dash dance turn was executed
  const dashDanceAnimations = [States.DASH, States.TURN, States.DASH];

  const initialState: {
    animations: number[],
    playerCounts: ?ActionCountsType
  } = {
    animations: [],
    playerCounts: null
  };

  let state = initialState;

  // Helper function for incrementing counts
  const incrementCount = (field, condition) => {
    if (!condition) {
      return;
    }

    state.playerCounts[field] += 1;
  };

  // Iterates the frames in order in order to compute stocks
  iterateFramesInOrder(game, (indices) => {
    const playerCounts = {
      playerIndex: indices.playerIndex,
      opponentIndex: indices.opponentIndex,
      wavedashCount: 0,
      wavelandCount: 0,
      airDodgeCount: 0,
      dashDanceCount: 0,
      spotDodgeCount: 0,
      rollCount: 0,
    };

    state = {
      ...initialState,
      playerCounts: playerCounts
    };

    actionCounts.push(playerCounts);
  }, (indices, frame) => {
    const playerFrame = frame.players[indices.playerIndex].post;

    // Manage animation state
    state.animations.push(playerFrame.actionStateId);

    // Grab last 3 frames
    const last3Frames = state.animations.slice(-3);
    const currentAnimation = playerFrame.actionStateId;
    const prevAnimation = last3Frames[last3Frames.length - 2];

    // Increment counts based on conditions
    const didDashDance = _.isEqual(last3Frames, dashDanceAnimations);
    incrementCount('dashDanceCount', didDashDance);

    const didRoll = didStartRoll(currentAnimation, prevAnimation);
    incrementCount('rollCount', didRoll);

    const didSpotDodge = didStartSpotDodge(currentAnimation, prevAnimation);
    incrementCount('spotDodgeCount', didSpotDodge);

    const didAirDodge = didStartAirDodge(currentAnimation, prevAnimation);
    incrementCount('airDodgeCount', didAirDodge);

    // Handles wavedash detection (and waveland)
    handleActionWavedash(state.playerCounts, state.animations, frame.frame);
  });

  return actionCounts;
}

function isWavedashInitiationAnimation(animation) {
  if (animation === States.AIR_DODGE) {
    return true;
  }

  const isAboveMin = animation >= States.CONTROLLED_JUMP_START;
  const isBelowMax = animation <= States.CONTROLLED_JUMP_END;
  return isAboveMin && isBelowMax;
}

function handleActionWavedash(counts: ActionCountsType, animations) {
  const currentAnimation = _.last(animations);
  const prevAnimation = animations[animations.length - 2];

  const isSpecialLanding = currentAnimation === States.LANDING_FALL_SPECIAL;
  const isAcceptablePrevious = isWavedashInitiationAnimation(prevAnimation);
  const isPossibleWavedash = isSpecialLanding && isAcceptablePrevious;

  if (!isPossibleWavedash) {
    return;
  }

  // Here we special landed, it might be a wavedash, let's check
  // We grab the last 8 frames here because that should be enough time to execute a
  // wavedash. This number could be tweaked if we find false negatives
  const recentFrames = animations.slice(-8);
  const recentAnimations = _.keyBy(recentFrames, (animation) => animation);

  if (_.size(recentAnimations) === 2 && recentAnimations[States.AIR_DODGE]) {
    // If the only other animation is air dodge, this might be really late to the point
    // where it was actually an air dodge. Air dodge animation is really long
    return;
  }

  if (recentAnimations[States.AIR_DODGE]) {
    // If one of the recent animations was an air dodge, let's remove that from the
    // air dodge counter, we don't want to count air dodges used to wavedash/land
    counts.airDodgeCount -= 1;
  }

  if (recentAnimations[States.ACTION_KNEE_BEND]) {
    // If a jump was started recently, we will consider this a wavedash
    counts.wavedashCount += 1;
  } else {
    // If there was no jump recently, this is a waveland
    counts.wavelandCount += 1;
  }
}
