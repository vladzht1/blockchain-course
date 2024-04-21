import { Server, WebSocket } from "ws";

import { P2P_PORT } from "../constants/env";
import { Peer } from "../peers";
import { createQueryLengthMessage } from "../shared";
import { MessageHandlerFactory } from "./message-handlers";

export const MAX_RETRIES = 3;

export const initializeP2PServer = async (): Promise<void> => {
  if (!WSServer.init(P2P_PORT)) {
    throw new Error("Unable to initialize P2P server!");
  }

  console.log(`WebSocket server is listening on: ws://localhost:${P2P_PORT}`);
}

export class WSServer {
  private static _instance: WSServer | null;

  // @ts-ignore not used here, however might be needed
  private _server: Server;
  private _sockets: WebSocket[] = [];

  private _isInitialized: boolean = false;

  public static init(port: number): boolean {
    this._instance = new WSServer(new WebSocket.Server({ port }));
    this._instance._isInitialized = true;

    return true;
  }

  public static getInstance(): WSServer {
    if (!this._instance || !this._instance._isInitialized) {
      throw new Error("WSServer is not initialized! Run `WSServer.init()` first");
    }

    return this._instance;
  }

  private constructor(server: Server) {
    this._server = server;
    server.on("connection", ws => this.initializeConnection(ws));
  }

  public get sockets(): WebSocket[] {
    return this._sockets;
  }

  public connectToPeers(peers: Peer[]): void {
    peers.forEach(peer => {
      const connected = this.connectToPeer(peer);

      !connected && console.error(`Connection to peer ${peer.address} failed`)
    });
  }

  private connectToPeer(peer: Peer, retries: number = 0): boolean {
    const ws = new WebSocket(peer.address);

    let success: boolean = true;

    ws.on("open", () => {
      this.initializeConnection(ws);
      success = true;
    });

    ws.on("error", () => {
      if (retries < MAX_RETRIES) {
        console.log(`Connection to peer failed, retrying ${retries + 1}...`);

        setTimeout(() => this.connectToPeer(peer, retries + 1), 200);
        return;
      }

      success = false;
    });

    return success;
  }

  private initializeConnection(ws: WebSocket): void {
    this._sockets.push(ws);

    this.initializeMessageHandler(ws);
    this.initializeErrorHandler(ws);

    ws.send(createQueryLengthMessage());
  }

  private initializeMessageHandler(ws: WebSocket): void {
    ws.on("message", data => {
      const message = JSON.parse(data.toString());
      const messageType = message["type"];

      console.log("Received message:", message);

      if (messageType == null) {
        console.log("Invalid message format: message must contain a `type` field");
        return;
      }

      const messageHandler = new MessageHandlerFactory().getHandler(messageType);
      messageHandler?.handle(ws, message);
    });
  }

  private initializeErrorHandler(ws: WebSocket): void {
    ws.on("close", () => this.closeConnectionWithMessage(ws, "Close connection event"));
    ws.on("error", error => this.closeConnectionWithMessage(ws, `Error occurred: ${error.message}`));
  }

  private closeConnectionWithMessage(ws: WebSocket, message: string): void {
    console.log(`${message}. Closing connection to peer: ${ws.url}`);

    this._sockets.splice(this._sockets.indexOf(ws), 1);
  }
}
