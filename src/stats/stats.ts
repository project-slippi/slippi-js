import _ from "lodash";

import { FrameEntryType, PlayerIndexedType, Frames, FramesType } from "./common";

export interface StatComputer<T> {
    setOpponentIndices(indices: PlayerIndexedType[]): void;
    processFrame(newFrame: FrameEntryType, allFrames: FramesType): void;
    fetch(): T;
}

export class Stats {
    private lastProcessedFrame: number | null = null;
    private frames: FramesType = {};
    private opponentIndices = new Array<PlayerIndexedType>();
    private allComputers = new Array<StatComputer<unknown>>();

    public setOpponentIndices(indices: PlayerIndexedType[]): void {
        this.opponentIndices = indices;
        this.allComputers.forEach(comp => comp.setOpponentIndices(indices));
    }

    public register(computer: StatComputer<unknown>): void {
        this.allComputers.push(computer);
    }

    public registerAll(computers: StatComputer<unknown>[]): void {
        this.allComputers = this.allComputers.concat(computers);
    }

    public process(): void {
        if (this.opponentIndices.length === 0) {
            return;
        }
        let i = this.lastProcessedFrame ? this.lastProcessedFrame + 1 : Frames.FIRST;
        while (this.frames[i]) {
            const frame = this.frames[i];
            // Don't attempt to compute stats on frames that have not been fully received
            if (!isCompletedFrame(this.opponentIndices, frame)) {
                return;
            }
            this.allComputers.forEach(comp => comp.processFrame(frame, this.frames));
            this.lastProcessedFrame = i;
            i++;
        }
    }

    public addFrame(frame: FrameEntryType): void {
        this.frames[frame.frame] = frame;
    }
}

function isCompletedFrame(opponentIndices: PlayerIndexedType[], frame: FrameEntryType): boolean {
    // This function checks whether we have successfully received an entire frame.
    // It is not perfect because it does not wait for follower frames. Fortunately,
    // follower frames are not used for any stat calculations so this doesn't matter
    // for our purposes.
    const indices = _.first(opponentIndices);
    const playerPostFrame = _.get(frame, ['players', indices.playerIndex, 'post']);
    const oppPostFrame = _.get(frame, ['players', indices.opponentIndex, 'post']);
    
    return Boolean(playerPostFrame && oppPostFrame);
}
