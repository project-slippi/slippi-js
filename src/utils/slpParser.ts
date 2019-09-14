import _ from "lodash";

import { PostFrameUpdateType, GameStartType } from "./slpReader";
import { Frames } from "../stats/common";

export class SlpParser {
    settings: GameStartType | null = null;

    public getSettings(): GameStartType | null {
        return this.settings;
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
        if (payload.frame === null || payload.frame > Frames.FIRST) {
          // Once we are an frame -122 or higher we are done getting match settings
          // Tell the iterator to stop
          return;
        }

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