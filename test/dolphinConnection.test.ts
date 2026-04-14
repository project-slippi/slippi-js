import { DolphinConnection, DolphinMessageType } from "../src/node/console/dolphinConnection";
import { BroadcastMessageType, ConnectionEvent, ConnectionStatus } from "../src/node/console/types";

// Mock enet module - define variables before jest.mock to avoid hoisting issues
let mockPeer: any;
let mockClient: any;
let mockEnet: any;
let connectCallback: Function | null = null;

// Initialize mocks before jest.mock is hoisted
const initMocks = () => {
  mockPeer = {
    on: jest.fn(),
    ping: jest.fn(),
    send: jest.fn(),
    disconnectLater: jest.fn(),
  };

  mockClient = {
    connect: jest.fn().mockImplementation((...args: any[]) => {
      // The callback is the last argument
      const callback = args[args.length - 1];
      if (typeof callback === "function") {
        connectCallback = callback;
      }
      return mockPeer;
    }),
    destroy: jest.fn(),
  };

  mockEnet = {
    createClient: jest.fn().mockReturnValue(mockClient),
    Packet: jest.fn().mockImplementation((data: string | Buffer) => ({
      data: jest.fn().mockReturnValue(Buffer.isBuffer(data) ? data : Buffer.from(data)),
    })),
    PACKET_FLAG: {
      RELIABLE: 1,
    },
  };
};

jest.mock("../src/node/console/loadEnetModule", () => ({
  loadEnetModule: jest.fn().mockImplementation(() => {
    // Return the mockEnet that will be set up in beforeEach
    return Promise.resolve(mockEnet);
  }),
}));

describe("DolphinConnection", () => {
  let connection: DolphinConnection;
  let emittedEvents: Map<string, any[]>;
  let peerEventHandlers: Map<string, Function>;

  beforeEach(() => {
    // Initialize mocks before each test
    initMocks();
    connectCallback = null;
    jest.clearAllMocks();
    connection = new DolphinConnection();
    emittedEvents = new Map();
    peerEventHandlers = new Map();

    // Capture peer event handlers
    mockPeer.on.mockImplementation((event: string, handler: Function) => {
      peerEventHandlers.set(event, handler);
      return mockPeer;
    });

    // Track all emitted events
    const originalEmit = connection.emit.bind(connection);
    connection.emit = jest.fn((event: ConnectionEvent, data: any) => {
      if (!emittedEvents.has(event)) {
        emittedEvents.set(event, []);
      }
      emittedEvents.get(event)!.push([event, data]);
      return originalEmit(event, data);
    }) as any;
  });

  afterEach(() => {
    connection.disconnect();
  });

  describe("when connecting", () => {
    it("should emit CONNECT event on successful connection", async () => {
      const connectHandler = jest.fn();
      connection.on(ConnectionEvent.CONNECT, connectHandler);

      await connection.connect("127.0.0.1", 51441);

      // Trigger the client.connect callback to emit CONNECT and set status
      if (connectCallback) {
        connectCallback(null, mockPeer);
      }

      expect(connectHandler).toHaveBeenCalled();
    });

    it("should emit STATUS_CHANGE through connection states", async () => {
      const statusHandler = jest.fn();
      connection.on(ConnectionEvent.STATUS_CHANGE, statusHandler);

      await connection.connect("127.0.0.1", 51441);

      expect(connection.getStatus()).toBe(ConnectionStatus.CONNECTING);

      // Trigger the client.connect callback to emit CONNECT and set status
      if (connectCallback) {
        connectCallback(null, mockPeer);
      }

      expect(statusHandler).toHaveBeenCalledWith(ConnectionStatus.CONNECTED);
      expect(connection.getStatus()).toBe(ConnectionStatus.CONNECTED);
    });

    it("should return correct connection settings", async () => {
      await connection.connect("192.168.1.100", 666);

      const settings = connection.getSettings();
      expect(settings.ipAddress).toBe("192.168.1.100");
      expect(settings.port).toBe(666);
    });

    it("should reset game cursor on connect", async () => {
      await connection.connect("127.0.0.1", 51441);

      // Simulate peer connect event
      const connectHandlerFn = peerEventHandlers.get("connect");
      if (connectHandlerFn) {
        connectHandlerFn();
      }

      const details = connection.getDetails();
      expect(details.gameDataCursor).toBe(0);
    });
  });

  describe("when handling handshake", () => {
    beforeEach(async () => {
      await connection.connect("127.0.0.1", 51441);

      // Simulate peer connect event
      const connectHandlerFn = peerEventHandlers.get("connect");
      if (connectHandlerFn) {
        connectHandlerFn();
      }
    });

    it("should emit HANDSHAKE with connection details on CONNECT_REPLY", () => {
      const handshakeHandler = jest.fn();
      connection.on(ConnectionEvent.HANDSHAKE, handshakeHandler);

      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.CONNECT_REPLY,
                cursor: 0,
                nick: "TestDolphin",
                version: "1.0.0",
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      expect(handshakeHandler).toHaveBeenCalled();
      expect(connection.getDetails().consoleNick).toBe("TestDolphin");
      expect(connection.getDetails().version).toBe("1.0.0");
    });
  });

  describe("when handling broadcast events", () => {
    beforeEach(async () => {
      await connection.connect("127.0.0.1", 51441);

      // Simulate peer connect event
      const connectHandlerFn = peerEventHandlers.get("connect");
      if (connectHandlerFn) {
        connectHandlerFn();
      }
    });

    it("should emit BROADCAST CONNECT_REPLY from Dolphin connect_reply", () => {
      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.CONNECT_REPLY,
                cursor: 5,
                nick: "TestConsole",
                version: "2.0.0",
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      const broadcastCalls = emittedEvents.get(ConnectionEvent.BROADCAST) || [];
      const connectReplyCall = broadcastCalls.find((call) => call[1]?.type === BroadcastMessageType.CONNECT_REPLY);

      expect(connectReplyCall).toBeDefined();
      expect(connectReplyCall[1]).toMatchObject({
        type: BroadcastMessageType.CONNECT_REPLY,
        cursor: 5,
        nextCursor: 5, // CONNECT_REPLY doesn't have next_cursor, so cursor is used
        nick: "TestConsole",
      });
    });

    it("should emit BROADCAST START_GAME from Dolphin start_game", () => {
      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.START_GAME,
                cursor: 0,
                next_cursor: 1,
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      const broadcastCalls = emittedEvents.get(ConnectionEvent.BROADCAST) || [];
      const startGameCall = broadcastCalls.find((call) => call[1]?.type === BroadcastMessageType.START_GAME);

      expect(startGameCall).toBeDefined();
      expect(startGameCall[1]).toMatchObject({
        type: BroadcastMessageType.START_GAME,
        cursor: 0,
        nextCursor: 1,
      });
    });

    it("should emit BROADCAST GAME_EVENT from Dolphin game_event", () => {
      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        // First update the cursor to match what GAME_EVENT expects
        const cursorUpdatePacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.START_GAME,
                cursor: 0,
                next_cursor: 10,
              }),
            ),
          ),
        };
        messageHandler(cursorUpdatePacket);

        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.GAME_EVENT,
                cursor: 10,
                next_cursor: 25,
                payload: "dGVzdGRhdGE=", // base64 encoded "testdata"
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      const broadcastCalls = emittedEvents.get(ConnectionEvent.BROADCAST) || [];
      const gameEventCall = broadcastCalls.find((call) => call[1]?.type === BroadcastMessageType.GAME_EVENT);

      expect(gameEventCall).toBeDefined();
      expect(gameEventCall[1]).toMatchObject({
        type: BroadcastMessageType.GAME_EVENT,
        cursor: 10,
        nextCursor: 25,
        payload: "dGVzdGRhdGE=",
      });
    });

    it("should emit BROADCAST END_GAME from Dolphin end_game", () => {
      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.END_GAME,
                cursor: 100,
                next_cursor: 101,
                payload: "ZW5kZ2FtZWRhdGE=", // base64 encoded "endgamedata"
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      const broadcastCalls = emittedEvents.get(ConnectionEvent.BROADCAST) || [];
      const endGameCall = broadcastCalls.find((call) => call[1]?.type === BroadcastMessageType.END_GAME);

      expect(endGameCall).toBeDefined();
      expect(endGameCall[1]).toMatchObject({
        type: BroadcastMessageType.END_GAME,
        cursor: 100,
        nextCursor: 101,
        payload: "ZW5kZ2FtZWRhdGE=",
      });
    });

    it("should emit BROADCAST END_GAME with undefined payload when not provided", () => {
      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.END_GAME,
                cursor: 200,
                next_cursor: 201,
                // No payload field
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      const broadcastCalls = emittedEvents.get(ConnectionEvent.BROADCAST) || [];
      const endGameCall = broadcastCalls.find((call) => call[1]?.type === BroadcastMessageType.END_GAME);

      expect(endGameCall).toBeDefined();
      expect(endGameCall[1]).toMatchObject({
        type: BroadcastMessageType.END_GAME,
        cursor: 200,
        nextCursor: 201,
      });
      expect(endGameCall[1].payload).toBeUndefined();
    });
  });

  describe("when handling backward compatibility", () => {
    beforeEach(async () => {
      await connection.connect("127.0.0.1", 51441);

      // Simulate peer connect event
      const connectHandlerFn = peerEventHandlers.get("connect");
      if (connectHandlerFn) {
        connectHandlerFn();
      }
    });

    it("should still emit MESSAGE event alongside BROADCAST", () => {
      const messageHandler = jest.fn();
      connection.on(ConnectionEvent.MESSAGE, messageHandler);

      const peerMessageHandler = peerEventHandlers.get("message");
      if (peerMessageHandler) {
        const dolphinMessage = {
          type: DolphinMessageType.GAME_EVENT,
          cursor: 30,
          next_cursor: 35,
          payload: "YmFja3dhcmRzY29tcGF0=",
        };
        const mockPacket = {
          data: jest.fn().mockReturnValue(Buffer.from(JSON.stringify(dolphinMessage))),
        };
        peerMessageHandler(mockPacket);
      }

      expect(messageHandler).toHaveBeenCalled();
      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DolphinMessageType.GAME_EVENT,
          cursor: 30,
          next_cursor: 35,
          payload: "YmFja3dhcmRzY29tcGF0=",
        }),
      );

      // Also verify BROADCAST was emitted
      const broadcastCalls = emittedEvents.get(ConnectionEvent.BROADCAST) || [];
      const gameEventCall = broadcastCalls.find((call) => call[1]?.type === BroadcastMessageType.GAME_EVENT);
      expect(gameEventCall).toBeDefined();
    });

    it("should handle all message types for both MESSAGE and BROADCAST", () => {
      const messageHandler = jest.fn();
      connection.on(ConnectionEvent.MESSAGE, messageHandler);

      const peerMessageHandler = peerEventHandlers.get("message");

      // Test CONNECT_REPLY
      if (peerMessageHandler) {
        peerMessageHandler({
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.CONNECT_REPLY,
                cursor: 0,
                nick: "Test",
              }),
            ),
          ),
        });
      }

      // Test START_GAME
      if (peerMessageHandler) {
        peerMessageHandler({
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.START_GAME,
                cursor: 1,
                next_cursor: 2,
              }),
            ),
          ),
        });
      }

      // Test GAME_EVENT
      if (peerMessageHandler) {
        peerMessageHandler({
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.GAME_EVENT,
                cursor: 2,
                next_cursor: 3,
                payload: "dGVzdA==",
              }),
            ),
          ),
        });
      }

      // Test END_GAME
      if (peerMessageHandler) {
        peerMessageHandler({
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.END_GAME,
                cursor: 3,
                next_cursor: 4,
              }),
            ),
          ),
        });
      }

      // Should have 4 MESSAGE events
      expect(messageHandler).toHaveBeenCalledTimes(4);

      // Should have 4 BROADCAST events
      const broadcastCalls = emittedEvents.get(ConnectionEvent.BROADCAST) || [];
      expect(broadcastCalls.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("when handling cursor management", () => {
    beforeEach(async () => {
      await connection.connect("127.0.0.1", 51441);

      // Simulate peer connect event
      const connectHandlerFn = peerEventHandlers.get("connect");
      if (connectHandlerFn) {
        connectHandlerFn();
      }
    });

    it("should update gameCursor from message next_cursor on GAME_EVENT", () => {
      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.GAME_EVENT,
                cursor: 0,
                next_cursor: 100,
                payload: "dGVzdA==",
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      const details = connection.getDetails();
      expect(details.gameDataCursor).toBe(100);
    });

    it("should emit ERROR on cursor mismatch", () => {
      const errorHandler = jest.fn();
      connection.on(ConnectionEvent.ERROR, errorHandler);

      // First message sets cursor to 10
      let messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.GAME_EVENT,
                cursor: 0,
                next_cursor: 10,
                payload: "dGVzdDE=",
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      // Second message with wrong cursor should emit error
      messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.GAME_EVENT,
                cursor: 99, // Expected 10, got 99
                next_cursor: 110,
                payload: "dGVzdDI=",
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      expect(errorHandler).toHaveBeenCalled();
    });

    it("should update cursor from CONNECT_REPLY", () => {
      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.CONNECT_REPLY,
                cursor: 42,
                nick: "TestConsole",
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      const details = connection.getDetails();
      expect(details.gameDataCursor).toBe(42);
    });
  });

  describe("when handling data", () => {
    beforeEach(async () => {
      await connection.connect("127.0.0.1", 51441);

      // Simulate peer connect event
      const connectHandlerFn = peerEventHandlers.get("connect");
      if (connectHandlerFn) {
        connectHandlerFn();
      }
    });

    it("should emit DATA event with decoded replay data on GAME_EVENT", () => {
      const dataHandler = jest.fn();
      connection.on(ConnectionEvent.DATA, dataHandler);

      const messageHandler = peerEventHandlers.get("message");
      const testData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.GAME_EVENT,
                cursor: 0,
                next_cursor: 1,
                payload: testData.toString("base64"),
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      expect(dataHandler).toHaveBeenCalled();
      const emittedData = dataHandler.mock.calls[0][0];
      expect(Buffer.from(emittedData)).toEqual(testData);
    });
  });

  describe("when disconnecting", () => {
    beforeEach(async () => {
      await connection.connect("127.0.0.1", 51441);

      // Simulate peer connect event
      const connectHandlerFn = peerEventHandlers.get("connect");
      if (connectHandlerFn) {
        connectHandlerFn();
      }
    });

    it("should cleanup state on disconnect", () => {
      connection.disconnect();

      // Simulate the peer disconnect event that fires after disconnectLater
      const disconnectHandler = peerEventHandlers.get("disconnect");
      if (disconnectHandler) {
        disconnectHandler();
      }

      expect(mockPeer.disconnectLater).toHaveBeenCalled();
      expect(connection.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });

    it("should emit STATUS_CHANGE to DISCONNECTED", () => {
      const statusHandler = jest.fn();
      connection.on(ConnectionEvent.STATUS_CHANGE, statusHandler);

      connection.disconnect();

      // Simulate the peer disconnect event that fires after disconnectLater
      const disconnectHandler = peerEventHandlers.get("disconnect");
      if (disconnectHandler) {
        disconnectHandler();
      }

      expect(statusHandler).toHaveBeenCalledWith(ConnectionStatus.DISCONNECTED);
    });

    it("should handle disconnect when peer is undefined", () => {
      // Create a new connection that won't have a peer
      const newConnection = new DolphinConnection();

      const statusHandler = jest.fn();
      newConnection.on(ConnectionEvent.STATUS_CHANGE, statusHandler);

      // This connection was never connected, so peer is undefined
      // disconnect() should immediately set status to DISCONNECTED
      newConnection.disconnect();

      expect(newConnection.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });
  });

  describe("when handling disconnection request", () => {
    beforeEach(async () => {
      await connection.connect("127.0.0.1", 51441);

      // Simulate peer connect event
      const connectHandlerFn = peerEventHandlers.get("connect");
      if (connectHandlerFn) {
        connectHandlerFn();
      }
    });

    it("should disconnect when dolphin_closed flag is received", () => {
      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.GAME_EVENT,
                dolphin_closed: true,
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      // Simulate the peer disconnect event that fires after disconnectLater
      const disconnectHandler = peerEventHandlers.get("disconnect");
      if (disconnectHandler) {
        disconnectHandler();
      }

      expect(connection.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });

    it("should disconnect when GAME_EVENT has no payload (legacy disconnection)", () => {
      const messageHandler = peerEventHandlers.get("message");
      if (messageHandler) {
        const mockPacket = {
          data: jest.fn().mockReturnValue(
            Buffer.from(
              JSON.stringify({
                type: DolphinMessageType.GAME_EVENT,
                cursor: 0,
                next_cursor: 1,
                // No payload field - legacy disconnection
              }),
            ),
          ),
        };
        messageHandler(mockPacket);
      }

      // Simulate the peer disconnect event that fires after disconnectLater
      const disconnectHandler = peerEventHandlers.get("disconnect");
      if (disconnectHandler) {
        disconnectHandler();
      }

      expect(connection.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });
  });
});
