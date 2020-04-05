import fsp from "@absolunet/fsp"
import ensureArray from "ensure-array"
import flattenMultiline from "flatten-multiline"
import path from "path"
import Sequelize from "sequelize"
import sortKeys from "sort-keys"

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
   constructor(handle, dry, logger, tweeterType, options) {
     this.handle = handle
     this.dry = dry
     this.logger = logger
     this.tweeterType = tweeterType
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
       }).json()
       this.logger.debug("Tweet result: [%s %s] %s", result.statusCode, result.statusMessage, result.body)
       return result
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

   getDataFolder() {
     return path.join(main.core.appFolder, "data", this.user.handle.toLowerCase(), this.tweeterType)
   }

   async initDatabase(modelMap) {
     const dataFolder = this.getDataFolder()
     await fsp.ensureDir(dataFolder)
     const databaseFile = path.join(dataFolder, "database.sqlite")
     this.database = new Sequelize({
       dialect: "sqlite",
       storage: databaseFile,
     })
     for (const [modelName, modelDefinition] of Object.entries(modelMap)) {
       const schema = sortKeys(modelDefinition.schema)
       modelDefinition.default.init(schema, {
         modelName,
         sequelize: this.database,
         ...modelDefinition.modelOptions,
       })
     }
     await this.database.sync()
   }

}