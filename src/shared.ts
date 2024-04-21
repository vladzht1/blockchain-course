import { WSServer } from "./_ws";
import { MessageType } from "./_ws/message-handlers";
import { Blockchain } from "./blockchain";

export const createQueryLengthMessage = () => (JSON.stringify({ type: MessageType.QUERY_LATEST }));
export const createQueryAllMessage = () => (JSON.stringify({ type: MessageType.QUERY_ALL }));

export const createResponseLatestMessage = () => ({
  type: MessageType.RESPONSE_BLOCKCHAIN,
  data: JSON.stringify([Blockchain.getInstance().getLatestBlock()])
});

export const createResponseChainMessage = () => ({
  type: MessageType.RESPONSE_BLOCKCHAIN,
  data: JSON.stringify(Blockchain.getInstance().blocks)
});

export const broadcastMessage = (message: any) => WSServer.getInstance().sockets.forEach(socket => {
  return socket.send(JSON.stringify(message));
});
