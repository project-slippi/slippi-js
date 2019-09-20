import _ from "lodash";

import { FrameEntryType, StockType, ConversionType, ComboType, ActionCountsType, OverallType, PlayerIndexedType, Frames, FramesType } from "./common";
import { ActionsComputer } from "./actions";
import { ConversionComputer } from "./conversions";
import { ComboComputer } from "./combos";
import { StockComputer } from "./stocks";
import { InputComputer } from "./inputs";
import { generateOverallStats } from "./overall";

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
    private lastProcessedFrame: number = Frames.FIRST;
    private lastFrame: number;
    private frames: FramesType = {};
    private opponentIndices: PlayerIndexedType[];
    private actionsComputer: ActionsComputer;
    private conversionComputer: ConversionComputer;
    private comboComputer: ComboComputer;
    private stockComputer: StockComputer;
    private inputComputer: InputComputer;
    private allComputers: StatComputer<unknown>[];
    private options: StatOptions;

    public constructor(opponentIndices: PlayerIndexedType[] = [], options?: StatOptions) {
        this.options = options || defaultOptions;
        this.opponentIndices = opponentIndices;
        this.actionsComputer = new ActionsComputer(opponentIndices);
        this.conversionComputer = new ConversionComputer(opponentIndices);
        this.comboComputer = new ComboComputer(opponentIndices);
        this.stockComputer = new StockComputer(opponentIndices);
        this.inputComputer = new InputComputer(opponentIndices);

        this.allComputers = [this.actionsComputer, this.conversionComputer, this.comboComputer, this.stockComputer, this.inputComputer];
    }

    private _process(): void {
        if (this.opponentIndices.length === 0) {
            return;
        }
        for (let i = this.lastProcessedFrame + 1; Boolean(this.frames[i]); i++) {
            const frame = this.frames[i];
            // Don't attempt to compute stats on frames that have not been fully received
            if (!isCompletedFrame(this.opponentIndices, frame)) {
                return;
            }
            this.allComputers.forEach(comp => comp.processFrame(frame, this.frames));
            this.lastProcessedFrame = i;
        }
    }

    public getStats(): ComputedStatsType {
        // Finish processing if we're not up to date
        if (this.lastFrame !== this.lastProcessedFrame) {
            this._process();
        }
        const inputs = this.inputComputer.fetch();
        const stocks = this.stockComputer.fetch();
        const conversions = this.conversionComputer.fetch();
        const overall = generateOverallStats(this.opponentIndices, inputs, stocks, conversions, this._playableFrameCount());
        return {
            lastFrame: this.lastFrame,
            playableFrameCount: this._playableFrameCount(),
            stocks: stocks,
            conversions: conversions,
            combos: this.comboComputer.fetch(),
            actionCounts: this.actionsComputer.fetch(),
            overall: overall,
        }
    }

    public addFrame(frame: FrameEntryType): void {
        this.frames[frame.frame] = frame;
        this.lastFrame = frame.frame;

        if (this.options.processOnTheFly) {
            this._process();
        }
    }

    private _playableFrameCount(): number {
        return this.lastFrame < Frames.FIRST_PLAYABLE ? 0 : this.lastFrame - Frames.FIRST_PLAYABLE;
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
