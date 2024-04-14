import { initializeHttpServer } from "./_http";
import { WSServer, initializeP2PServer } from "./_ws";
import { INITIAL_PEERS } from "./constants/env";
import { parsePeersFromString } from "./peers";

initializeHttpServer();
initializeP2PServer();

WSServer.getInstance().connectToPeers(parsePeersFromString(INITIAL_PEERS));
