import { decode, encode } from "@shelacek/ubjson";

export enum CommunicationType {
  HANDSHAKE = 1,
  REPLAY = 2,
  KEEP_ALIVE = 3,
}

export interface CommunicationMessage {
  type: CommunicationType;
  payload: {
    cursor: Uint8Array;
    clientToken: Uint8Array;
    pos: Uint8Array;
    nextPos: Uint8Array;
    data: Uint8Array;
    nick: string | null;
    forcePos: boolean;
    nintendontVersion: string | null;
  };
}

// This class is responsible for handling the communication protocol between the Wii and the
// desktop app
export class ConsoleCommunication {
  private receiveBuf = Buffer.from([]);
  private messages = new Array<CommunicationMessage>();

  public receive(data: Buffer): void {
    this.receiveBuf = Buffer.concat([this.receiveBuf, data]);

    while (this.receiveBuf.length >= 4) {
      // First get the size of the message we are expecting
      const msgSize = this.receiveBuf.readUInt32BE(0);

      if (this.receiveBuf.length < msgSize + 4) {
        // If we haven't received all the data yet, let's wait for more
        return;
      }

      // Here we have received all the data, so let's decode it
      const ubjsonData = this.receiveBuf.slice(4, msgSize + 4);
      this.messages.push(decode(ubjsonData));

      // Remove the processed data from receiveBuf
      this.receiveBuf = this.receiveBuf.slice(msgSize + 4);
    }
  }

  public getReceiveBuffer(): Buffer {
    return this.receiveBuf;
  }

  public getMessages(): Array<CommunicationMessage> {
    const toReturn = this.messages;
    this.messages = [];

    return toReturn;
  }

  public genHandshakeOut(cursor: Uint8Array, clientToken: number, isRealtime = false): Buffer {
    const clientTokenBuf = Buffer.from([0, 0, 0, 0]);
    clientTokenBuf.writeUInt32BE(clientToken, 0);

    const message = {
      type: CommunicationType.HANDSHAKE,
      payload: {
        cursor: cursor,
        clientToken: Uint8Array.from(clientTokenBuf), // TODO: Use real instance token
        isRealtime: isRealtime,
      },
    };

    const buf = encode(message, {
      optimizeArrays: true,
    });

    const msg = Buffer.concat([Buffer.from([0, 0, 0, 0]), Buffer.from(buf)]);

    msg.writeUInt32BE(buf.byteLength, 0);

    return msg;
  }
}
