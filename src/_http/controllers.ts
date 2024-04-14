import { Router } from "express";

import { WSServer } from "../_ws";
import { BlockGenerator, Blockchain } from "../blockchain";
import { PeerContainer } from "../peers";
import { broadcastMessage, createResponseLatestMessage } from "../shared";

export const router = Router();

router.get("/blocks", (_, res) => {
  return res.json(Blockchain.getInstance().blocks);
});

router.post("/mine_block", (req, res) => {
  const { data } = req.body;

  if (!data) {
    console.error("No data to mine block found in query:\n" + req.body);

    return res.status(400).json({
      statusCode: 400,
      message: "No data was provided to mine block"
    });
  }

  const blockGenerator = new BlockGenerator();
  // const nextBlock = blockGenerator.generateNext(data, Blockchain.getInstance());
  const nextBlock = blockGenerator.mineBlock(data, Blockchain.getInstance());

  if (!nextBlock) {
    return res.status(400).json({
      statusCode: 400,
      message: "Unable to generate next block"
    });
  }

  Blockchain.getInstance().addBlock(nextBlock);
  broadcastMessage(createResponseLatestMessage());

  console.log("Block added:", nextBlock);

  return res.status(201).json({
    statusCode: 201,
    message: "Block successfully added"
  });
});

router.get("/peers", (_, res) => {
  return res.status(200).json(PeerContainer.getInstance().peers)
});

router.post("/peers", (req, res) => {
  const [peer] = req.body;

  if (!peer) {
    console.error("No peer for connection found in request:\n" + req.body);
    return res.status(400).json({
      statusCode: 400,
      message: "No peer for connection found in request: peer must be provided"
    });
  }

  WSServer.getInstance().connectToPeers([])
  return res.status(204);
});
