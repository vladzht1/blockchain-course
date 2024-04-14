export class Peer {
  private _host: string;
  private _port: number;

  public constructor(host: string, port: number) {
    this._host = host;
    this._port = port;
  }

  public get host(): string {
    return this._host;
  }

  public get port(): number {
    return this._port;
  }

  public get address(): string {
    return `ws://${this._host}:${this._port}`;
  }
}

export class PeerContainer {
  private static _instance: PeerContainer | null;

  private _peers: Peer[] = [];

  public static getInstance(): PeerContainer {
    if (!this._instance) {
      this._instance = new PeerContainer();
    }

    return this._instance;
  }

  private constructor() { }

  public get peers(): Peer[] {
    return this._peers;
  }

  public addPeers(peers: Peer[]): boolean {
    // TODO: Check if peer is already on the list
    peers.forEach(peer => this.peers.push(peer));
    return true;
  }
}

export const parsePeersFromString = (peersAsString: string[]): Peer[] => {
  const peers: Peer[] = [];

  peersAsString.forEach(peer => {
    const updatedPeer = peer.replace("/", "");
    const [protocol, host, port] = updatedPeer.split(':');

    if (!protocol || protocol !== "ws" || !host || !port || isNaN(parseInt(port))) {
      console.log(`Invalid peer: ${peer}, skipping`);
    } else {
      peers.push(new Peer(host, parseInt(port)));
    }
  });

  return peers;
}
