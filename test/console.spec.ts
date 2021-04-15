import { ConsoleConnection, DolphinConnection } from "../src";
import Mitm from "mitm";

var mitm = Mitm();
mitm.on("connection", function (socket: any) {
  socket.write("Hello back!");
});

mitm.on("connect", function (socket: any) {
  socket.write("Hello back!");
});

describe("when using console folder", () => {
  it("console connection should work", () => {
    mitm.disable();

    const connection = new ConsoleConnection();
    connection.connect("localhost", 667);
    connection.on("data", (data) => {
      console.log(data);
    });

    connection.on("statusChange", (status) => {
      console.log(status);
    });

    connection.getStatus();
    connection.getSettings();
    connection.getDetails();
    connection.disconnect();
  });

  it("dolphin connection should work", () => {
    const connection = new DolphinConnection();
    connection.connect("localhost", 667);
    connection.getStatus();
    connection.getSettings();
    connection.getDetails();
    connection.disconnect();
  });
});
