import ensureArray from "ensure-array"
import flattenMultiline from "flatten-multiline"

import {config} from "src/core"
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
   constructor(handle, dry, logger, options) {
     this.handle = handle
     this.dry = dry
     this.logger = logger
     this.index = currentIndex
     this.options = options
     currentIndex++
     for (const [key, value] of Object.entries(this.options)) {
       this.logger.debug(`${key}: ${JSON.stringify(value)}`)
     }
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
       this.logger.info("[Tweeter #%s] @%s: %s", this.index, this.handle, flattenMultiline(text))
       if (media) {
         this.logger.debug(`Media length: ${ensureArray(media).map(entry => entry.length).join(", ")}`)
       }
       if (this.dry) {
         return
       }
       const result = await Tweeter.apiGot.post("tweet", {
         json: {
           text,
           media,
           handle: this.handle,
         },
       })
       this.logger.debug("Tweet result: [%s %s] %s", result.statusCode, result.statusMessage, result.body)
     } catch (error) {
       this.logger.error("[Tweeter #%s] Could not send tweet: %s", this.index, error)
     }
   }

   async postMedia(media) {
     await this.post("", media)
   }

   /**
    * @param {string} tweetId
    * @return {Promise<Object>}
    */
   async getTweetById(tweetId) {
     const response = await this.twit.get("statuses/show", {
       id: tweetId,
       include_entities: true,
       trim_user: false,
       include_ext_alt_text: true,
     })
     return response.data
   }

}