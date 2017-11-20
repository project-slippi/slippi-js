// @flow
import _ from 'lodash';
import { Commands, openSlpFile, iterateEvents } from './slpReader';
import type {
  PlayerType, SlpFileType
} from "./slpReader";

type GameSettingsType = {
  stageId: number,
  isTeams: boolean,
  players: PlayerType[]
};

export default class SlippiGame {
  filePath: string;
  file: SlpFileType;
  settings: GameSettingsType;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.file = openSlpFile(filePath);
  }

  getSettings(): GameSettingsType {
    if (this.settings) {
      // If header is already generated, return it
      return this.settings;
    }

    // Prepare default settings
    const settings: GameSettingsType = {
      stageId: 0,
      isTeams: false,
      players: []
    };

    // Generate settings from iterating through file
    iterateEvents(this.file, (command, payload) => {
      if (!payload) {
        // If payload is falsy, keep iterating. The parser probably just doesn't know
        // about this command yet
        return false;
      }

      switch (command) {
      case Commands.GAME_START:
        if (!payload.stageId) {
          return true; // Why do I have to do this? Still not sold on Flow
        }

        settings.stageId = payload.stageId;
        settings.isTeams = payload.isTeams;
        settings.players = _.filter(payload.players, player => player.type !== 3);
        break;
      case Commands.FRAME_UPDATE:
        if (!payload.frame) {
          return true; // Why do I have to do this? Still not sold on Flow
        }

        if (payload.frame > -123) {
          // Once we are an frame -122 or higher we are done getting match settings
          // Tell the iterator to stop
          return true;
        }

        const playerIndex = payload.playerIndex;
        switch (payload.internalCharacterId) {
        case 0x7:
          settings.players[playerIndex].characterId = 0x13; // Sheik
          break;
        case 0x13:
          settings.players[playerIndex].characterId = 0x12; // Zelda
          break;
        }
        break;
      }

      return false; // Tell the iterator to keep iterating
    });

    this.settings = settings;
    return settings;
  }
}
