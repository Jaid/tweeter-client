import {config, logger} from "src/core"
import main from "src/plugins/main"

let currentIndex = 1

export default class Tweeter {

    static apiGot = null

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

    /**
     * @async
     * @param {string} text
     * @param {string|string[]} [media]
     */
    async post(text, media) {
      if (!Tweeter.apiGot) {
        Tweeter.apiGot = main.core.got.extend({
          method: "POST",
          baseUrl: `${config.apiProtocol}://${config.apiHost}`,
          port: config.apiPort,
          headers: {
            "Content-type": "application/json",
          },
        })
      }
      try {
        debugger
        logger.info("[Tweeter #%s] @%s: %s", this.index, this.handle, text)
        const result = await Tweeter.apiGot.post("tweet", {
          body: JSON.stringify({
            text,
            media,
            handle: this.handle,
            apiUser: config.apiUser,
            apiKey: config.apiKey,
          }),
        })
        logger.debug("Tweet result: [%s %s] %s", result.statusCode, result.statusMessage, result.body)
      } catch (error) {
        logger.error("[Tweeter #%s] Could not send tweet: %s", this.index, error)
      }
    }

    async postMedia(media) {
      await this.post("", media)
    }

}