import config from "lib/config"
import got from "got"
import logger from "lib/logger"

export default class Tweeter {

  static apiGot = got.extend({
    method: "POST",
    protocol: config.apiProtocol,
    baseUrl: config.apiHost,
    port: config.apiPort,
  })

  constructor(handle) {
    this.handle = handle
    logger.info("Registered tweeter for @%s", handle)
  }

  async post(text) {
    try {
      await Tweeter.apiGot.post("tweet", {
        body: {
          text,
          handle: this.handle,
          apiUser: config.apiUser,
          apiKey: config.apiKey,
        } |> JSON.stringify,
      })
    } catch (error) {
      logger.error("Could not send \"%s\" as %s: %s", text, this.handle, error)
    }
  }

}