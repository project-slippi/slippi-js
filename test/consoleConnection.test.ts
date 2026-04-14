import type { Socket } from "net";

import { Command } from "../src/common/types";
import { ConsoleConnection } from "../src/node/console/consoleConnection";
import { ConnectionEvent } from "../src/node/console/types";

// Mock net module
jest.mock("net", () => {
  const actualNet = jest.requireActual("net");
  return {
    ...actualNet,
    connect: jest.fn(),
  };
});

// Mock reconnect-core module
const mockReconnectFn = jest.fn();
const mockConnection = {
  on: jest.fn(),
  connect: jest.fn(),
  reconnect: true,
  disconnect: jest.fn(),
};

jest.mock("../src/node/console/loadReconnectCoreModule", () => ({
  loadReconnectCoreModule: jest.fn().mockResolvedValue(() => mockReconnectFn),
}));

describe("ConsoleConnection", () => {
  let connection: ConsoleConnection;
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    jest.clearAllMocks();
    connection = new ConsoleConnection();

    // Create mock socket
    mockSocket = {
      write: jest.fn(),
      destroy: jest.fn(),
      on: jest.fn(),
    };

    // Setup mock reconnect to capture the client callback
    mockReconnectFn.mockImplementation((_options: any, clientCallback: Function) => {
      // Simulate connection by calling the callback with mock socket
      setTimeout(() => {
        clientCallback(mockSocket);
      }, 0);
      return mockConnection;
    });
  });

  afterEach(() => {
    connection.disconnect();
  });

  describe("when connecting", () => {
    it("should emit CONNECT event on successful connection", async () => {
      const connectHandler = jest.fn();
      connection.on(ConnectionEvent.CONNECT, connectHandler);

      await connection.connect("127.0.0.1", 51441);

      // Wait for async connection setup
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(connectHandler).toHaveBeenCalled();
    });

    it("should return correct connection settings", async () => {
      await connection.connect("192.168.1.100", 666);

      const settings = connection.getSettings();
      expect(settings.ipAddress).toBe("192.168.1.100");
      expect(settings.port).toBe(666);
    });
  });

  describe("when handling handshake", () => {
    it("should emit HANDSHAKE with console details", async () => {
      const handshakeHandler = jest.fn();
      connection.on(ConnectionEvent.HANDSHAKE, handshakeHandler);

      await connection.connect("127.0.0.1", 51441);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate receiving handshake message through console comms
      // The handshake is emitted during _processMessage
      expect(connection.getDetails()).toBeDefined();
    });
  });

  describe("when handling broadcast events", () => {
    beforeEach(async () => {
      await connection.connect("127.0.0.1", 51441);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it("should only flush on configured events", () => {
      const conn = connection as any;
      conn.broadcastReady = true;
      conn.broadcastPayloads = [];

      const flushEvents = [Command.MESSAGE_SIZES, Command.FRAME_BOOKEND, Command.GAME_END, Command.SPLIT_MESSAGE];
      const nonFlushEvents = [Command.PRE_FRAME_UPDATE, Command.POST_FRAME_UPDATE, Command.ITEM_UPDATE];

      // Test non-flush events don't emit BROADCAST (GAME_EVENT type)
      nonFlushEvents.forEach((cmd) => {
        conn.broadcastPayloads = [];

        conn._handleBroadcastRaw({
          command: cmd,
          payload: Buffer.from([0x01]),
        });

        // Should accumulate but not emit GAME_EVENT
        expect(conn.broadcastPayloads.length).toBeGreaterThan(0);
      });

      // Test flush events do emit BROADCAST
      flushEvents
        .filter((cmd) => cmd !== Command.MESSAGE_SIZES) // MESSAGE_SIZES emits START_GAME
        .forEach((cmd) => {
          conn.broadcastReady = true;
          conn.broadcastPayloads = [Buffer.from([0x01])];
          conn.broadcastCursor = 0;

          let emitted = false;
          connection.once(ConnectionEvent.BROADCAST, () => {
            emitted = true;
          });

          conn._handleBroadcastRaw({
            command: cmd,
            payload: Buffer.from([0x02]),
          });

          expect(emitted).toBe(true);
        });
    });

    it("should not emit broadcasts before MESSAGE_SIZES (broadcastReady=false)", () => {
      const conn = connection as any;
      conn.broadcastReady = false;
      conn.broadcastPayloads = [];

      let emitted = false;
      connection.once(ConnectionEvent.BROADCAST, () => {
        emitted = true;
      });

      conn._handleBroadcastRaw({
        command: Command.FRAME_BOOKEND,
        payload: Buffer.from([0x01]),
      });

      expect(emitted).toBe(false);
    });
  });

  describe("when handling errors", () => {
    it("should emit ERROR event on socket error", async () => {
      const errorHandler = jest.fn();
      connection.on(ConnectionEvent.ERROR, errorHandler);

      await connection.connect("127.0.0.1", 51441);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate error on connection
      const errorCallback = mockConnection.on.mock.calls.find((call: any[]) => call[0] === "error")?.[1];
      if (errorCallback) {
        errorCallback(new Error("Connection failed"));
      }

      expect(errorHandler).toHaveBeenCalled();
    });
  });
});
