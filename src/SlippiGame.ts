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
  RollbackFrames,
} from "./types";
import { GameMode, Language } from "./types";
import { positionToHomeRunDistance } from "./utils/homeRunDistance";
import { SlpParser, SlpParserEvent } from "./utils/slpParser";
import type { SlpReadInput } from "./utils/slpReader";
import { closeSlpFile, getGameEnd, getMetadata, iterateEvents, openSlpFile, SlpInputSource } from "./utils/slpReader";

/**
 * Slippi Game class that wraps a file
 */
export class SlippiGame {
  private input: SlpReadInput;
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
  protected stadiumStatsComputer: Stats;

  public constructor(input: string | Buffer | ArrayBuffer, opts?: StatOptions) {
    if (typeof input === "string") {
      this.input = {
        source: SlpInputSource.FILE,
        filePath: input,
      };
    } else if (input instanceof Buffer) {
      this.input = {
        source: SlpInputSource.BUFFER,
        buffer: input,
      };
    } else if (input instanceof ArrayBuffer) {
      this.input = {
        source: SlpInputSource.BUFFER,
        buffer: Buffer.from(input),
      };
    } else {
      throw new Error("Cannot create SlippiGame with input of that type");
    }

    // Set up stats calculation
    this.statsComputer = new Stats(opts);
    this.statsComputer.register(
      this.actionsComputer,
      this.comboComputer,
      this.conversionComputer,
      this.inputComputer,
      this.stockComputer,
    );

    // Set up stadium stats calculation
    this.stadiumStatsComputer = new Stats(opts);
    this.stadiumStatsComputer.register(this.targetBreakComputer);

    this.parser = new SlpParser();
    this.parser.on(SlpParserEvent.SETTINGS, (settings) => {
      this.statsComputer.setup(settings);
      this.stadiumStatsComputer.setup(settings);
    });

    // Use finalized frames for stats computation
    this.parser.on(SlpParserEvent.FINALIZED_FRAME, (frame: FrameEntryType) => {
      this.statsComputer.addFrame(frame);
      this.stadiumStatsComputer.addFrame(frame);
    });
  }

  private _process(shouldStop: EventCallbackFunc = () => false): void {
    if (this.parser.getGameEnd() !== null) {
      return;
    }
    const slpfile = openSlpFile(this.input);
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
    closeSlpFile(slpfile);
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
      const slpfile = openSlpFile(this.input);
      const gameEnd = getGameEnd(slpfile);
      closeSlpFile(slpfile);
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
    if (settings === null) {
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

    this.stadiumStatsComputer.process();

    let sandbag = null;
    for (let i = 0; i < settings.players.length; i++) {
      sandbag = players[i]?.post.internalCharacterId === 32 ? players[i]?.post : null;
    }

    const stadiumStats: StadiumStatsType = {
      targetBreaks: settings.gameMode === GameMode.TARGET_TEST ? this.targetBreakComputer.fetch() : null,
      // homerun distance depends on the language setting (not NTSC/PAL) and JPN has not been implemented
      homeRunDistance:
        settings.gameMode === GameMode.HOME_RUN_CONTEST && sandbag
          ? positionToHomeRunDistance(
              sandbag.positionX ?? 0,
              settings.language === Language.ENGLISH ? "feet" : "meters",
            )
          : null,
    };

    return stadiumStats;
  }

  public getMetadata(): MetadataType | null {
    if (this.metadata) {
      return this.metadata;
    }
    const slpfile = openSlpFile(this.input);
    this.metadata = getMetadata(slpfile);
    closeSlpFile(slpfile);
    return this.metadata;
  }

  public getFilePath(): string | null {
    if (this.input.source !== SlpInputSource.FILE) {
      return null;
    }

    return this.input.filePath ?? null;
  }

  public getWinners(): PlacementType[] {
    const gameEnd = this.getGameEnd({ skipProcessing: true });
    if (!gameEnd) {
      return [];
    }

    const placements = gameEnd.placements;
    const firstPosition = placements.find((placement) => placement?.position === 0);
    if (!firstPosition) {
      return [];
    }

    const settings = this.getSettings();
    if (settings?.isTeams) {
      const winningTeam = settings.players.find(({ playerIndex }) => playerIndex === firstPosition.playerIndex)?.teamId;
      return placements.filter((placement) => {
        const teamId = settings.players.find(({ playerIndex }) => playerIndex === placement.playerIndex)?.teamId;
        return teamId === winningTeam;
      });
    }

    return [firstPosition];
  }
}
