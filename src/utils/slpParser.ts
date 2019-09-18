import _ from "lodash";

import { PostFrameUpdateType, GameStartType, GameEndType, Command, PreFrameUpdateType } from "./slpReader";
import { Frames, PlayerIndexedType } from "../stats/common";
import { FramesType, FrameEntryType } from "../SlippiGame";

export class SlpParser {
    settings: GameStartType | null = null;
    playerFrames: FramesType | null = null;
    followerFrames: FramesType | null = null;
    gameEnd: GameEndType | null = null;
    latestFrameIndex: number | null = null;

    constructor() {
        this.playerFrames = {};
        this.followerFrames = {};
    }


    public getSettings(): GameStartType | null {
        return this.settings;
    }

    public getFrames(): FramesType | null {
        if (this.playerFrames && this.gameEnd) {
            // If game end has been detected, we can returned cached version of frames
            return this.playerFrames;
        }
        return null;
    }

    public handleGameEnd(payload: GameEndType): void {
        payload = payload as GameEndType;
        this.gameEnd = payload;
    }

    public handleGameStart(payload: GameStartType): void {
        if (!payload.stageId) {
            return;
        }

        this.settings = payload;
        const players = payload.players;
        this.settings.players = players.filter(player => player.type !== 3);
    }

    public handlePostFrameUpdate(payload: PostFrameUpdateType): void {
        if (payload.frame === null) {
            // Once we are an frame -122 or higher we are done getting match settings
            // Tell the iterator to stop
            return;
        }
        // handle settings calculation
        if (payload.frame <= Frames.FIRST) {
            const playerIndex = payload.playerIndex;
            const playersByIndex = _.keyBy(this.settings.players, 'playerIndex');

            switch (payload.internalCharacterId) {
                case 0x7:
                    playersByIndex[playerIndex].characterId = 0x13; // Sheik
                    break;
                case 0x13:
                    playersByIndex[playerIndex].characterId = 0x12; // Zelda
                    break;
            }
        }
    }

    public handleFrameUpdate(command: Command, payload: PreFrameUpdateType | PostFrameUpdateType): FrameEntryType {
        payload = payload as PostFrameUpdateType;
        if (!payload.frame && payload.frame !== 0) {
            // If payload is messed up, stop iterating. This shouldn't ever happen
            return;
        }

        const location = command === Command.PRE_FRAME_UPDATE ? "pre" : "post";
        const frames = payload.isFollower ? this.followerFrames : this.playerFrames;
        this.latestFrameIndex = payload.frame;
        _.set(frames, [payload.frame, 'players', payload.playerIndex, location], payload);
        _.set(frames, [payload.frame, 'frame'], payload.frame);

        return frames[payload.frame];
    }

}
