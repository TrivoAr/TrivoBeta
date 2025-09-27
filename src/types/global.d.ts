import { SocketServer } from "@/libs/socketServer";

declare global {
  // eslint-disable-next-line no-var
  var socketServer: SocketServer | undefined;

  namespace NodeJS {
    interface Global {
      socketServer?: SocketServer;
    }
  }
}

export {};