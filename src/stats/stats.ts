import _ from "lodash";

import { StockType, ConversionType, ComboType, ActionCountsType, OverallType, PlayerIndexedType } from "./common";
import { FrameEntryType } from "../SlippiGame";
import { ActionsComputer } from "./actions";
import { ConversionComputer } from "./conversions";

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
    gameComplete: boolean;
    lastFrame: number;
    playableFrameCount: number;
    stocks: StockType[];
    combos: ComboType[];
    actionCounts: ActionCountsType[];
    overall: OverallType[];

    opponentIndices: PlayerIndexedType[];
    actionsComputer: ActionsComputer;
    conversionComputer: ConversionComputer;

    constructor(opponentIndices: PlayerIndexedType[]) {
        this.opponentIndices = opponentIndices;
        this.actionsComputer = new ActionsComputer(opponentIndices);
        this.conversionComputer = new ConversionComputer(opponentIndices);
    }

    public getStats(): StatsType {
        return {
            gameComplete: this.gameComplete,
            lastFrame: this.lastFrame,
            playableFrameCount: this.playableFrameCount,
            stocks: this.stocks,
            conversions: this.conversionComputer.fetch(),
            combos: this.combos,
            actionCounts: this.actionsComputer.fetch(),
            overall: this.overall,
        }
    }

    public processFrame(frame: FrameEntryType): void {
        if (this.opponentIndices.length === 0) {
            return;
        }
        this.opponentIndices.forEach(indices => {
            const playerPostFrame = _.get(frame, ['players', indices.playerIndex, 'post']);
            const oppPostFrame = _.get(frame, ['players', indices.opponentIndex, 'post']);
            if (!playerPostFrame || !oppPostFrame) {
                // Don't attempt to compute stats on frames that have not been fully received
                return;
            }
        });

        this.actionsComputer.processFrame(frame);
        this.conversionComputer.processFrame(frame);
    }
}