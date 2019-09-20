import _ from "lodash";

import { FrameEntryType, StockType, ConversionType, ComboType, ActionCountsType, OverallType, PlayerIndexedType, Frames, FramesType } from "./common";

export type ComputedStatsType = {
  lastFrame: number;
  playableFrameCount: number;
  stocks: StockType[];
  conversions: ConversionType[];
  combos: ComboType[];
  actionCounts: ActionCountsType[];
  overall: OverallType[];
};

export interface StatComputer<T> {
    setPlayerIndices(indices: PlayerIndexedType[]): void;
    processFrame(newFrame: FrameEntryType, allFrames: FramesType): void;
    fetch(): T;
}

export interface StatOptions {
    processOnTheFly: boolean;
}

const defaultOptions: StatOptions = {
    processOnTheFly: false,
}

export class Stats {
    private options: StatOptions;
    private lastProcessedFrame: number | null = null;
    private lastFrame: number;
    private frames: FramesType = {};
    private opponentIndices = new Array<PlayerIndexedType>();
    private allComputers = new Array<StatComputer<unknown>>();

    public constructor(options?: StatOptions) {
        this.options = options || defaultOptions;
    }

    public setPlayerIndices(indices: PlayerIndexedType[]): void {
        this.opponentIndices = indices;
        this.allComputers.forEach(comp => comp.setPlayerIndices(indices));
    }

    public register(computer: StatComputer<unknown>): void {
        this.allComputers.push(computer);
    }

    public registerAll(computers: StatComputer<unknown>[]): void {
        this.allComputers = this.allComputers.concat(computers);
    }

    public process(): void {
        // Finish processing if we're not up to date
        if (this.lastFrame === this.lastProcessedFrame) {
            return;
        }
        if (this.opponentIndices.length === 0) {
            return;
        }
        let i = this.lastProcessedFrame ? this.lastProcessedFrame + 1 : Frames.FIRST;
        while (Boolean(this.frames[i])) {
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
        this.lastFrame = frame.frame;

        if (this.options.processOnTheFly) {
            this.process();
        }
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
