import type { StadiumStatsType, StatOptions, StatsType } from "./stats";
import { TargetBreakComputer } from "./stats";
import {
  ActionsComputer,
  ComboComputer,
  ConversionComputer,
  generateOverallStats,
  InputComputer,
  Stats,
  StockComputer,
} from "./stats";
import type {
  EnabledItemType,
  EventCallbackFunc,
  FrameEntryType,
  FramesType,
  GameEndType,
  GameStartType,
  GeckoListType,
  MetadataType,
  PlacementType,
  PostFrameUpdateType,
  RollbackFrames,
} from "./types";
import { GameEndMethod, GameMode } from "./types";
import { getWinners } from "./utils/getWinners";
import { extractDistanceInfoFromFrame } from "./utils/homeRunDistance";
import type { SlpInputRef } from "./utils/slpInputRef";
import { SlpParser, SlpParserEvent } from "./utils/slpParser";
import type { SlpFileType } from "./utils/slpReader";
import { extractFinalPostFrameUpdates, getGameEnd, getMetadata, iterateEvents, openSlpFile } from "./utils/slpReader";

/**
 * Slippi Game class that wraps a file
 */
export abstract class SlippiGameBase {
  private metadata: MetadataType | null = null;
  private finalStats: StatsType | null = null;
  private parser: SlpParser;
  private readPosition: number | null = null;
  private actionsComputer: ActionsComputer = new ActionsComputer();
  private conversionComputer: ConversionComputer = new ConversionComputer();
  private comboComputer: ComboComputer = new ComboComputer();
  private stockComputer: StockComputer = new StockComputer();
  private inputComputer: InputComputer = new InputComputer();
  private targetBreakComputer: TargetBreakComputer = new TargetBreakComputer();
  protected statsComputer: Stats;

  public constructor(private readonly input: SlpInputRef, opts?: StatOptions) {
    // Set up stats calculation
    this.statsComputer = new Stats(opts);
    this.statsComputer.register(
      this.actionsComputer,
      this.comboComputer,
      this.conversionComputer,
      this.inputComputer,
      this.stockComputer,
      this.targetBreakComputer,
    );

    this.parser = new SlpParser();
    this.parser.on(SlpParserEvent.SETTINGS, (settings) => {
      this.statsComputer.setup(settings);
    });

    // Use finalized frames for stats computation
    this.parser.on(SlpParserEvent.FINALIZED_FRAME, (frame: FrameEntryType) => {
      this.statsComputer.addFrame(frame);
    });
  }

  private _process(shouldStop: EventCallbackFunc = () => false, file?: SlpFileType): void {
    if (this.parser.getGameEnd() !== null) {
      return;
    }
    this.input.open();
    const slpfile = file ?? openSlpFile(this.input);
    // Generate settings from iterating through file
    this.readPosition = iterateEvents(
      slpfile,
      (command, payload) => {
        if (!payload) {
          // If payload is falsy, keep iterating. The parser probably just doesn't know
          // about this command yet
          return false;
        }
        this.parser.handleCommand(command, payload);
        return shouldStop(command, payload);
      },
      this.readPosition,
    );
    if (!file) {
      this.input.close();
    }
  }

  /**
   * Gets the game settings, these are the settings that describe the starting state of
   * the game such as characters, stage, etc.
   */
  public getSettings(): GameStartType | null {
    // Settings is only complete after post-frame update
    this._process(() => this.parser.getSettings() !== null);
    return this.parser.getSettings();
  }

  public getItems(): EnabledItemType[] | null {
    this._process();
    return this.parser.getItems();
  }

  public getLatestFrame(): FrameEntryType | null {
    this._process();
    return this.parser.getLatestFrame();
  }

  public getGameEnd(options: { skipProcessing?: boolean } = {}): GameEndType | null {
    if (options?.skipProcessing) {
      // Read game end block directly
      this.input.open();
      const slpfile = openSlpFile(this.input);
      const gameEnd = getGameEnd(slpfile);
      this.input.close();
      return gameEnd;
    }

    this._process();
    return this.parser.getGameEnd();
  }

  public getFrames(): FramesType {
    this._process();
    return this.parser.getFrames();
  }

  public getRollbackFrames(): RollbackFrames {
    this._process();
    return this.parser.getRollbackFrames();
  }

  public getGeckoList(): GeckoListType | null {
    this._process(() => this.parser.getGeckoList() !== null);
    return this.parser.getGeckoList();
  }

  public getStats(): StatsType | null {
    if (this.finalStats) {
      return this.finalStats;
    }

    this._process();

    const settings = this.parser.getSettings();
    if (!settings) {
      return null;
    }

    // Finish processing if we're not up to date
    this.statsComputer.process();
    const inputs = this.inputComputer.fetch();
    const stocks = this.stockComputer.fetch();
    const conversions = this.conversionComputer.fetch();
    const playableFrameCount = this.parser.getPlayableFrameCount();
    const overall = generateOverallStats({ settings, inputs, conversions, playableFrameCount });

    const gameEnd = this.parser.getGameEnd();
    const gameComplete = gameEnd !== null;

    const stats: StatsType = {
      lastFrame: this.parser.getLatestFrameNumber(),
      playableFrameCount,
      stocks: stocks,
      conversions: conversions,
      combos: this.comboComputer.fetch(),
      actionCounts: this.actionsComputer.fetch(),
      overall: overall,
      gameComplete,
    };

    if (gameComplete) {
      // If the game is complete, store a cached version of stats because it should not
      // change anymore. Ideally the statsCompuer.process and fetch functions would simply do no
      // work in this case instead but currently the conversions fetch function,
      // generateOverallStats, and maybe more are doing work on every call.
      this.finalStats = stats;
    }

    return stats;
  }

  public getStadiumStats(): StadiumStatsType | null {
    this._process();

    const settings = this.parser.getSettings();
    if (!settings) {
      return null;
    }

    const latestFrame = this.parser.getLatestFrame();
    const players = latestFrame?.players;

    if (!players) {
      return null;
    }

    this.statsComputer.process();

    switch (settings.gameMode) {
      case GameMode.TARGET_TEST:
        return {
          type: "target-test",
          targetBreaks: this.targetBreakComputer.fetch(),
        };
      case GameMode.HOME_RUN_CONTEST:
        const distanceInfo = extractDistanceInfoFromFrame(settings, latestFrame);
        if (!distanceInfo) {
          return null;
        }

        return {
          type: "home-run-contest",
          distance: distanceInfo.distance,
          units: distanceInfo.units,
        };
      default:
        return null;
    }
  }

  public getMetadata(): MetadataType | null {
    if (this.metadata) {
      return this.metadata;
    }
    this.input.open();
    const slpfile = openSlpFile(this.input);
    this.metadata = getMetadata(slpfile);
    this.input.close();
    return this.metadata;
  }

  public abstract getFilePath(): string | null;

  public getWinners(): PlacementType[] {
    // Read game end block directly
    this.input.open();
    const slpfile = openSlpFile(this.input);
    const gameEnd = getGameEnd(slpfile);
    this._process(() => this.parser.getSettings() !== null, slpfile);
    const settings = this.parser.getSettings();
    if (!gameEnd || !settings) {
      // Technically using the final post frame updates, it should be possible to compute winners for
      // replays without a gameEnd message. But I'll leave this here anyway
      this.input.close();
      return [];
    }

    // If we went to time, let's fetch the post frame updates to compute the winner
    let finalPostFrameUpdates: PostFrameUpdateType[] = [];
    if (gameEnd.gameEndMethod === GameEndMethod.TIME) {
      finalPostFrameUpdates = extractFinalPostFrameUpdates(slpfile);
    }

    this.input.close();
    return getWinners(gameEnd, settings, finalPostFrameUpdates);
  }
}
