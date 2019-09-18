import _ from "lodash";
/* eslint-disable no-param-reassign */
import EventEmitter from "events";
import { Readable } from 'stream';
import { SlpStream, SlpEvent } from './utils/slpStream';
import { SlpParser } from './utils/slpParser';
import { FramesType, StatsType, FrameEntryType } from './SlippiGame';
import { GameStartType, MetadataType, GameEndType, Command, PostFrameUpdateType, PreFrameUpdateType } from './utils/slpReader';
import { getSinglesOpponentIndicesFromSettings, PlayerIndexedType } from "./stats/common";

/**
 * Slippi Game class that wraps a read stream
 */
export class SlippiRealtime extends EventEmitter {
  stream: SlpStream;
  parser: SlpParser;
  settings: GameStartType | null;
  playerFrames: FramesType | null;
  followerFrames: FramesType | null;
  stats: StatsType | null;
  metadata: MetadataType | null;
  gameEnd: GameEndType | null;

  latestFrameIndex: number | null;
  frameReadPos: number | null;
  playerIndices: PlayerIndexedType[] = [];

  constructor(stream: Readable) {
    super();
    this.frameReadPos = null;
    this.latestFrameIndex = null;
    this.parser = new SlpParser();
    this.stream = new SlpStream(stream);
  }

  public start(): void {
    this.stream.on(SlpEvent.GAME_START, (command: Command, payload: GameStartType) => {
      this.parser.handleGameStart(payload);
      this.playerIndices = getSinglesOpponentIndicesFromSettings(this.parser.getSettings());
      this.emit("gameStart");
    });

    this.stream.on(SlpEvent.POST_FRAME_UPDATE, (command: Command, payload: PostFrameUpdateType) => {
      this.parser.handlePostFrameUpdate(payload);
      const frame = this.parser.handleFrameUpdate(command, payload)
      if (isCompletedFrame(this.playerIndices, frame)) {
        this.emit("newFrame", frame);
      };
    });

    this.stream.on(SlpEvent.PRE_FRAME_UPDATE, (command: Command, payload: PreFrameUpdateType) => {
      const frame = this.parser.handleFrameUpdate(command, payload)
      if (isCompletedFrame(this.playerIndices, frame)) {
        this.emit("newFrame", frame);
      };
    });

    this.stream.on(SlpEvent.GAME_END, (command: Command, payload: GameEndType) => {
      this.parser.handleGameEnd(payload);
      this.emit("gameEnd");
    });
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