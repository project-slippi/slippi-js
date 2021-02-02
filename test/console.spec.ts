import * as Console from "../src/console";

let consoleConnection = new Console.ConsoleConnection()
let dolphineConnection = new Console.DolphinConnection()
let defaultConsoleConnection = {
  details: { 
    consoleNick: 'unknown',
    gameDataCursor: new Uint8Array([ 0, 0, 0, 0, 0, 0, 0, 0 ]),
    version: '',
    clientToken: 0
  },
  settings: {
    ipAddress: '0.0.0.0',
    port: 51441
  },
  status: 0
}
let defaultDolphinConnection = {
  details: {
    consoleNick: 'unknown',
    gameDataCursor: 0,
    version: ''
  },
  settings: {
    ipAddress: '0.0.0.0',
    port: 51441
  },
  status: 0
}


describe("Console Connection Class", () => {
  beforeEach(()=>{
    consoleConnection = new Console.ConsoleConnection()
  })
  it("should have expected default values", () => {
    expect(consoleConnection.getDetails()).toEqual(defaultConsoleConnection.details);
    expect(consoleConnection.getSettings()).toEqual(defaultConsoleConnection.settings);
    expect(consoleConnection.getStatus()).toEqual(defaultConsoleConnection.status);
  });
});

describe("Console Communication Class", () => {
  beforeEach(()=>{
    dolphineConnection = new Console.DolphinConnection()
  })
  it("should have expected default values", () => {
    expect(dolphineConnection.getDetails()).toEqual(defaultDolphinConnection.details);
    expect(dolphineConnection.getSettings()).toEqual(defaultDolphinConnection.settings);
    expect(dolphineConnection.getStatus()).toEqual(defaultDolphinConnection.status);
  });
});