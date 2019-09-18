import _ from "lodash";

import { StockType, ConversionType, ComboType, ActionCountsType, OverallType, PlayerIndexedType } from "./common";
import { FrameEntryType } from "../SlippiGame";
import { ActionsComputer } from "./actions";
import { ConversionComputer } from "./conversions";
import { ComboComputer } from "./combos";
import { StockComputer } from "./stocks";

export type StatsType = {
  gameComplete: boolean;
  lastFrame: number;
  playableFrameCount: number;
  stocks: StockType[];
  conversions: ConversionType[];
  combos: ComboType[];
  actionCounts: ActionCountsType[];
  overall: OverallType[];
};

export interface StatComputer<T> {
    processFrame( frame: FrameEntryType): void;
    fetch(): T;
}

export class Stats {
    private gameComplete: boolean;
    private lastFrame: number;
    private playableFrameCount: number;
    private overall: OverallType[];
    private opponentIndices: PlayerIndexedType[];
    private actionsComputer: ActionsComputer;
    private conversionComputer: ConversionComputer;
    private comboComputer: ComboComputer;
    private stockComputer: StockComputer;
    private allComputers: Array<StatComputer<unknown>>;

    public constructor(opponentIndices: PlayerIndexedType[]) {
        this.opponentIndices = opponentIndices;
        this.actionsComputer = new ActionsComputer(opponentIndices);
        this.conversionComputer = new ConversionComputer(opponentIndices);
        this.comboComputer = new ComboComputer(opponentIndices);
        this.stockComputer = new StockComputer(opponentIndices);

        this.allComputers = [this.actionsComputer, this.conversionComputer, this.comboComputer, this.stockComputer];
    }

    public getStats(): StatsType {
        return {
            gameComplete: this.gameComplete,
            lastFrame: this.lastFrame,
            playableFrameCount: this.playableFrameCount,
            stocks: this.stockComputer.fetch(),
            conversions: this.conversionComputer.fetch(),
            combos: this.comboComputer.fetch(),
            actionCounts: this.actionsComputer.fetch(),
            overall: this.overall,
        }
    }

    public processFrame(frame: FrameEntryType): void {
        if (this.opponentIndices.length === 0) {
            return;
        }

        // Don't attempt to compute stats on frames that have not been fully received
        if (!isCompletedFrame(this.opponentIndices, frame)) {
            return;
        }

        this.allComputers.forEach(comp => comp.processFrame(frame));
    }
}

function isCompletedFrame(opponentIndices: PlayerIndexedType[], frame: FrameEntryType): boolean {
    for (const indices of opponentIndices) {
        const playerPostFrame = _.get(frame, ['players', indices.playerIndex, 'post']);
        const oppPostFrame = _.get(frame, ['players', indices.opponentIndex, 'post']);
        if (!playerPostFrame || !oppPostFrame) {
            return false;
        }
    }
    return true;
}
