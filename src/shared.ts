import { WSServer } from "./_ws";
import { MessageType } from "./_ws/message-handlers";
import { Blockchain } from "./blockchain";

export const createQueryLengthMessage = () => ({ type: MessageType.QUERY_LATEST });
export const createQueryAllMessage = () => ({ type: MessageType.QUERY_ALL });

export const createResponseLatestMessage = () => ({
  type: MessageType.RESPONSE_BLOCKCHAIN,
  data: [Blockchain.getInstance().getLatestBlock()]
});

export const createResponseChainMessage = () => ({
  type: MessageType.RESPONSE_BLOCKCHAIN,
  data: Blockchain.getInstance().blocks
});

export const broadcastMessage = (message: any) => WSServer.getInstance().sockets.forEach(socket => {
  return socket.send(JSON.stringify(message));
});
