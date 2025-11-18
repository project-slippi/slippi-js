import type { FrameEntryType, FramesType, GameStartType } from "../types";
import { Frames } from "../types";
import type { PlayerIndexedType } from "./common";
import { getSinglesPlayerPermutationsFromSettings } from "./common";
import type { StatComputer } from "./stats";

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
}

export type PlayerInput = {
  playerIndex: number;
  opponentIndex: number;
  inputCount: number;
  joystickInputCount: number;
  cstickInputCount: number;
  buttonInputCount: number;
  triggerInputCount: number;
};

export class InputComputer implements StatComputer<PlayerInput[]> {
  private state = new Map<PlayerIndexedType, PlayerInput>();
  private playerPermutations = new Array<PlayerIndexedType>();

  public setup(settings: GameStartType): void {
    // Reset the state
    this.state = new Map();
    this.playerPermutations = getSinglesPlayerPermutationsFromSettings(settings);

    this.playerPermutations.forEach((indices) => {
      const playerState: PlayerInput = {
        playerIndex: indices.playerIndex,
        opponentIndex: indices.opponentIndex,
        inputCount: 0,
        joystickInputCount: 0,
        cstickInputCount: 0,
        buttonInputCount: 0,
        triggerInputCount: 0,
      };
      this.state.set(indices, playerState);
    });
  }

  public processFrame(frame: FrameEntryType, allFrames: FramesType): void {
    this.playerPermutations.forEach((indices) => {
      const state = this.state.get(indices);
      if (state) {
        handleInputCompute(allFrames, state, indices, frame);
      }
    });
  }

  public fetch(): PlayerInput[] {
    return Array.from(this.state.values());
  }
}

function handleInputCompute(
  frames: FramesType,
  state: PlayerInput,
  indices: PlayerIndexedType,
  frame: FrameEntryType,
): void {
  const playerFrame = frame.players[indices.playerIndex]!.pre;
  const currentFrameNumber = playerFrame.frame!;
  const prevFrameNumber = currentFrameNumber - 1;
  const prevPlayerFrame = frames[prevFrameNumber] ? frames[prevFrameNumber]!.players[indices.playerIndex]!.pre : null;

  if (currentFrameNumber < Frames.FIRST_PLAYABLE || !prevPlayerFrame) {
    // Don't count inputs until the game actually starts
    return;
  }

  // First count the number of buttons that go from 0 to 1
  // Increment action count by amount of button presses
  const invertedPreviousButtons = ~prevPlayerFrame.physicalButtons!;
  const currentButtons = playerFrame.physicalButtons!;
  const buttonChanges = invertedPreviousButtons & currentButtons & 0xfff;
  const newInputsPressed = countSetBits(buttonChanges);
  state.inputCount += newInputsPressed;
  state.buttonInputCount += newInputsPressed;

  // Increment action count when sticks change from one region to another.
  // Don't increment when stick returns to deadzone
  const prevAnalogRegion = getJoystickRegion(prevPlayerFrame.joystickX!, prevPlayerFrame.joystickY!);
  const currentAnalogRegion = getJoystickRegion(playerFrame.joystickX!, playerFrame.joystickY!);
  if (prevAnalogRegion !== currentAnalogRegion && currentAnalogRegion !== JoystickRegion.DZ) {
    state.inputCount += 1;
    state.joystickInputCount += 1;
  }

  // Do the same for c-stick
  const prevCstickRegion = getJoystickRegion(prevPlayerFrame.cStickX!, prevPlayerFrame.cStickY!);
  const currentCstickRegion = getJoystickRegion(playerFrame.cStickX!, playerFrame.cStickY!);
  if (prevCstickRegion !== currentCstickRegion && currentCstickRegion !== JoystickRegion.DZ) {
    state.inputCount += 1;
    state.cstickInputCount += 1;
  }

  // Increment action on analog trigger... I'm not sure when. This needs revision
  // Currently will update input count when the button gets pressed past 0.3
  // Changes from hard shield to light shield should probably count as inputs but
  // are not counted here
  if (prevPlayerFrame.physicalLTrigger! < 0.3 && playerFrame.physicalLTrigger! >= 0.3) {
    state.inputCount += 1;
    state.triggerInputCount += 1;
  }
  if (prevPlayerFrame.physicalRTrigger! < 0.3 && playerFrame.physicalRTrigger! >= 0.3) {
    state.inputCount += 1;
    state.triggerInputCount += 1;
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
