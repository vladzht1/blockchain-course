import { config } from "dotenv";

config();

export const HTTP_PORT: number = parseInt(process.env["HTTP_PORT"] ?? "3000");
export const P2P_PORT: number = parseInt(process.env["P2P_PORT"] ?? "6000");

const PEER_FROM_ENV = process.env["INITIAL_PEERS"]

export const INITIAL_PEERS: string[] = PEER_FROM_ENV ? PEER_FROM_ENV.split(",").map(peer => peer.trim()) : [];

export const DIFFICULTY = 4;
