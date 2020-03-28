import {config, logger} from "src/core"
import main from "src/plugins/main"

let currentIndex = 1

export default class Tweeter {

  /**
   * @type {import("got").Got}
   */
   static apiGot = null

   /**
     * @constructor
     * @param {string} handle
     */
   constructor(handle, dry, options) {
     this.handle = handle
     this.dry = dry
     this.index = currentIndex
     this.options = options
     currentIndex++
   }

   static initStatic() {
     /**
      * @type {import("got").Got}
      */
     const got = main.core.got
     Tweeter.apiGot = got.extend({
       method: "POST",
       prefixUrl: `${config.apiProtocol}://${config.apiHost}`,
       port: config.apiPort,
       hooks: {
         init: [
           options => {
             if (!options.json) {
               options.json = {}
             }
             Object.assign(options.json, {
               apiUser: config.apiUser,
               apiKey: config.apiKey,
             })
           },
         ],
       },
     })
   }

   /**
     * @async
     * @param {string} text
     * @param {string|string[]} [media]
     */
   async post(text, media) {

     try {
       logger.info("[Tweeter #%s] @%s: %s", this.index, this.handle, text)
       logger.debug(`Media length: ${media.length}`)
       const result = await Tweeter.apiGot.post("tweet", {
         json: {
           text,
           media,
           handle: this.handle,
         },
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