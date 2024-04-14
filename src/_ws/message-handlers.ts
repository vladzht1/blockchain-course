import { WebSocket } from "ws";

import { Block, Blockchain } from "../blockchain";
import { broadcastMessage, createQueryAllMessage, createResponseChainMessage, createResponseLatestMessage } from "../shared";

export enum MessageType {
  QUERY_LATEST = 0,
  QUERY_ALL = 1,
  RESPONSE_BLOCKCHAIN = 2
}

export interface IMessageHandler {
  handle(ws: WebSocket, message: any): void;
}

export class QueryLatestMessageHandler implements IMessageHandler {
  public handle(ws: WebSocket, _: any): void {
    ws.send(JSON.stringify(createResponseLatestMessage()));
  }
}

export class QueryAllMessageHandler implements IMessageHandler {
  public handle(ws: WebSocket, _: any): void {
    ws.send(JSON.stringify(createResponseChainMessage()));
  }
}

export class ResponseBlockchainMessageHandler implements IMessageHandler {
  public handle(_: WebSocket, message: any): void {
    const receivedBlocks: Block[] = JSON.parse(message.data).sort((left: Block, right: Block) => left.getIndex() - right.getIndex());

    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    const latestBlockHeld = Blockchain.getInstance().getLatestBlock();

    // This must never happen as there is always the genesis block
    if (!latestBlockReceived) {
      console.log("No blocks were received, nothing to handle");
      return;
    }

    if (latestBlockReceived.getIndex() > latestBlockHeld.getIndex()) {
      console.log(`Blockchain possibly behind. We got: ${latestBlockHeld.getIndex()}, peer got ${latestBlockReceived.getIndex()}`);

      if (latestBlockHeld.getHash() === latestBlockReceived.getPreviousHash()) {
        console.log("We can append the received block to our chain");

        Blockchain.getInstance().addBlock(latestBlockReceived);
        broadcastMessage(createResponseLatestMessage());

        return;
      }

      if (receivedBlocks.length === 1) {
        console.log("We have to query the chain from out peer");
        broadcastMessage(createQueryAllMessage());

        return;
      }

      console.log("Received blockchain is longer than current blockchain");

      Blockchain.getInstance().replaceChain(receivedBlocks);
      broadcastMessage(createResponseLatestMessage());

      return;
    }

    console.log("Received blockchain is not longer than current blockchain. Do nothing");
  }
}

export class MessageHandlerFactory {
  public getHandler(type: MessageType): IMessageHandler | null {
    switch (type) {
      case MessageType.QUERY_LATEST:
        return new QueryLatestMessageHandler();
      case MessageType.QUERY_ALL:
        return new QueryAllMessageHandler();
      case MessageType.RESPONSE_BLOCKCHAIN:
        return new ResponseBlockchainMessageHandler();
      default:
        console.log(`Invalid message type: ${type}. Handler could not be provided.`);

        return null;
    }
  }
}
