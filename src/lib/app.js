import http from "http"
import https from "https"

import config from "lib/config"
import logger from "lib/logger"
import express from "express"

const app = express()
http.createServer(app).listen(config.apiPort)
logger.info("Started HTTP server on port %s", config.apiPort)

if (config.apiSslPort) {
  https.createServer(app).listen(config.apiSslPort)
  logger.info("Started HTTPS server on port %s", config.apiSslPort)
}

export default app