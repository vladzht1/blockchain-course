import bodyParser from "body-parser";
import express from "express";

import { HTTP_PORT } from "../constants/env";
import { router } from "./controllers";

export const initializeHttpServer = async (): Promise<void> => {
  const app = express();

  app.use(bodyParser.json());
  app.use(router);

  app.all("*", (_, res) => res.status(404).json({
    statusCode: 404,
    message: "Not Found",
  }));

  app.listen(HTTP_PORT, () => console.log(`HTTP server is listening on port http://localhost:${HTTP_PORT}`));
}
