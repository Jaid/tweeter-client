import logger from "lib/logger"
import config from "lib/config"
import app from "lib/app"
import bodyParser from "body-parser"
import twitterClient from "src/twitterClient"
import ensureArray from "ensure-array"

/**
 * @typedef ApiUser
 * @type {Object}
 * @prop {string} user
 * @prop {string} key
 */

class Api {

  constructor() {
    /**
     * @type {ApiUser[]}
     */
    this.apiUsers = ensureArray(config.apiUser)
  }

  getApiUser(user, key) {
    return this.apiUsers.find(apiUser => apiUser.user === user && apiUser.key === key)
  }

  async init() {
    app.post("/tweet", bodyParser.json(), async (request, response) => {
      for (const requiredArgument of ["text", "handle", "apiUser", "apiKey"]) {
        if (!request.body?.[requiredArgument]) {
          response.send(`body.${requiredArgument} not given`)
          return
        }
      }
      const apiUser = this.getApiUser(request.body.apiUser, request.body.apiKey)
      if (!apiUser) {
        response.send("Invalid API User")
        logger.warn("Someone tried to send a tweet with user %s and key %s", request.body.apiUser, request.body.apiKey)
        return
      }
      logger.info("[User %s] @%s: %s", request.body.apiUser, request.body.handle, request.body.text)
      const tweetResult = await twitterClient.tweet(request.body.handle.toLowerCase(), request.body.text)
      response.send(tweetResult.statusMessage)
    })
    logger.info("Started API server")
  }

}

export default new Api