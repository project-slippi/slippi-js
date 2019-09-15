import { StockType, ConversionType, ComboType, ActionCountsType, OverallType } from "./common";

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

export class Stats {
    gameComplete: boolean;
    lastFrame: number;
    playableFrameCount: number;
    stocks: StockType[];
    conversions: ConversionType[];
    combos: ComboType[];
    actionCounts: ActionCountsType[];
    overall: OverallType[];

    public getStats(): StatsType {
        return {
            gameComplete: this.gameComplete,
            lastFrame: this.lastFrame,
            playableFrameCount: this.playableFrameCount,
            stocks: this.stocks,
            conversions: this.conversions,
            combos: this.combos,
            actionCounts: this.actionCounts,
            overall: this.overall,
        }
    }

    public processFrame(): void {
        return;
    }
}