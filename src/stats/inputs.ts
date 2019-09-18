import _ from 'lodash';
import { FramesType, FrameEntryType, SlippiGame } from "../SlippiGame";
import { Frames, PlayerIndexedType, iterateFramesInOrder } from "./common";

import { StatComputer } from './stats';

enum JoystickRegion {
  DZ = 0,
  NE = 1,
  SE = 2,
  SW = 3,
  NW = 4,
  N = 5,
  E = 6,
  S = 7,
  W = 8,
};

export interface PlayerInput {
  playerIndex: number;
  opponentIndex: number;
  inputCount: number;
}

export class InputComputer implements StatComputer<Array<PlayerInput>> {
  private opponentIndices: PlayerIndexedType[];
  private frames: FramesType = {};
  private state: Map<PlayerIndexedType, PlayerInput>;

  public constructor(opponentIndices: PlayerIndexedType[]) {
    this.opponentIndices = opponentIndices;
    this.state = new Map<PlayerIndexedType, PlayerInput>();

    this.opponentIndices.forEach((indices) => {
      const playerState: PlayerInput = {

        playerIndex: indices.playerIndex,
        opponentIndex: indices.opponentIndex,
        inputCount: 0,
      }
      this.state.set(indices, playerState);
    })
  }

  public processFrame(frame: FrameEntryType): void {
    this.frames[frame.frame] = frame;
    this.opponentIndices.forEach((indices) => {
      const state = this.state.get(indices);
      handleInputCompute(this.frames, state, indices, frame);
    });
  }

  public fetch(): Array<PlayerInput> {
    return Array.from(this.state.keys()).map(key => this.state.get(key));
  }
}

export function generateInputs(game: SlippiGame): Array<PlayerInput> {
  const inputs: Array<PlayerInput> = [];
  const frames = game.getFrames();

  let state: PlayerInput;

  // Iterates the frames in order in order to compute stocks
  iterateFramesInOrder(game, (indices) => {
    const playerInputs: PlayerInput = {
      playerIndex: indices.playerIndex,
      opponentIndex: indices.opponentIndex,
      inputCount: 0,
    };

    state = playerInputs;

    inputs.push(playerInputs);
  }, (indices, frame) => {
    handleInputCompute(frames, state, indices, frame);
  });

  return inputs;
}

function handleInputCompute(frames: FramesType, state: PlayerInput, indices: PlayerIndexedType, frame: FrameEntryType): void {
  const playerFrame = frame.players[indices.playerIndex].pre;
  // FIXME: use PreFrameUpdateType instead of any
  // This is because the default value {} should not be casted as a type of PreFrameUpdateType
  const prevPlayerFrame: any = _.get(
    frames, [playerFrame.frame - 1, 'players', indices.playerIndex, 'pre'], {}
  );

  if (playerFrame.frame < Frames.FIRST_PLAYABLE) {
    // Don't count inputs until the game actually starts
    return;
  }

  // First count the number of buttons that go from 0 to 1
  // Increment action count by amount of button presses
  const invertedPreviousButtons = ~prevPlayerFrame.physicalButtons;
  const currentButtons = playerFrame.physicalButtons;
  const buttonChanges = (invertedPreviousButtons & currentButtons) & 0xFFF;
  state.inputCount += countSetBits(buttonChanges);

  // Increment action count when sticks change from one region to another.
  // Don't increment when stick returns to deadzone
  const prevAnalogRegion = getJoystickRegion(
    prevPlayerFrame.joystickX, prevPlayerFrame.joystickY
  );
  const currentAnalogRegion = getJoystickRegion(
    playerFrame.joystickX, playerFrame.joystickY
  );
  if ((prevAnalogRegion !== currentAnalogRegion) && (currentAnalogRegion !== 0)) {
    state.inputCount += 1;
  }

  // Do the same for c-stick
  const prevCstickRegion = getJoystickRegion(prevPlayerFrame.cStickX, prevPlayerFrame.cStickY);
  // FIXME: stop using any. it is not clear what type this is. cstickX does not exist on the type PreFrameUpdateType
  const currentCstickRegion = getJoystickRegion((playerFrame as any).cStickX, (playerFrame as any).cStickY);
  if ((prevCstickRegion !== currentCstickRegion) && (currentCstickRegion !== 0)) {
    state.inputCount += 1;
  }

  // Increment action on analog trigger... I'm not sure when. This needs revision
  // Currently will update input count when the button gets pressed past 0.3
  // Changes from hard shield to light shield should probably count as inputs but
  // are not counted here
  // FIXME: the lTrigger parameter does not exist on the PreFrameUpdateType
  if (prevPlayerFrame.lTrigger < 0.3 && (playerFrame as any).lTrigger >= 0.3) {
    state.inputCount += 1;
  }
  // FIXME: the rTrigger parameter does not exist on the PreFrameUpdateType
  if (prevPlayerFrame.rTrigger < 0.3 && (playerFrame as any).rTrigger >= 0.3) {
    state.inputCount += 1;
  }
}

function countSetBits(x: number): number {
  // This function solves the Hamming Weight problem. Effectively it counts the number of
  // bits in the input that are set to 1
  // This implementation is supposedly very efficient when most bits are zero.
  // Found: https://en.wikipedia.org/wiki/Hamming_weight#Efficient_implementation
  let bits = x;

  let count;
  for (count = 0; bits; count += 1) {
    bits &= bits - 1;
  }
  return count;
}

function getJoystickRegion(x: number, y: number): JoystickRegion {
  let region = JoystickRegion.DZ;

  if (x >= 0.2875 && y >= 0.2875) {
    region = JoystickRegion.NE;
  } else if (x >= 0.2875 && y <= -0.2875) {
    region = JoystickRegion.SE;
  } else if (x <= -0.2875 && y <= -0.2875) {
    region = JoystickRegion.SW;
  } else if (x <= -0.2875 && y >= 0.2875) {
    region = JoystickRegion.NW;
  } else if (y >= 0.2875) {
    region = JoystickRegion.N;
  } else if (x >= 0.2875) {
    region = JoystickRegion.E;
  } else if (y <= -0.2875) {
    region = JoystickRegion.S;
  } else if (x <= -0.2875) {
    region = JoystickRegion.W;
  }

  return region;
}