import config from "lib/config"
import got from "got"
import logger from "lib/logger"

let currentIndex = 1

export default class Tweeter {

  static apiGot = got.extend({
    method: "POST",
    baseUrl: `${config.apiProtocol}://${config.apiHost}`,
    port: config.apiPort,
  })

  /**
   * @constructor
   * @param {string} handle
   */
  constructor(handle) {
    this.handle = handle
    this.index = currentIndex
    currentIndex++
    logger.info("Registered tweeter #%s for @%s", this.index, handle)
  }

  async post(text) {
    logger.info("[Tweeter #%s] @%s: %s", this.index, this.handle, text)
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
      logger.error("[Tweeter #%s] Could not send tweet: %s", this.index, error)
    }
  }

}