import crypto from "crypto"
import path from "path"

import got from "got"
import config from "lib/config"
import logger from "lib/logger"
import Oauth from "oauth-1.0a"
import queryString from "query-string"
import globby from "globby"
import fsp from "@absolunet/fsp"

const hash_function = (text, key) => crypto.createHmac("sha1", key).update(text).digest("base64")

class TwitterClient {

  constructor() {
    this.client = new Oauth({
      hash_function,
      consumer: {
        key: config.twitterConsumerKey,
        secret: config.twitterConsumerSecret,
      },
      signature_method: "HMAC-SHA1",
    })
    this.oauthCallback = `${config.protocol}://${config.host}:${config.apiPort}/callback`
    this.usersFolder = path.join(logger.appFolder, "users")
  }

  async init() {
    const userFiles = await globby("*/credentials.yml", {
      cwd: this.usersFolder,
      onlyFiles: true,
      absolute: true,
    })
    const loadUsersJobs = userFiles.map(async file => {
      return fsp.readYaml(file)
    })
    this.users = await Promise.all(loadUsersJobs)
    logger.info("Started twitterClient with %s users", this.users.length)
    logger.debug("Callback: %s", this.oauthCallback)
  }

  getUserByInternalId(id) {
    return this.users.find(({internalId}) => internalId === id)
  }

  getFolderForUser(internalId) {
    return path.join(this.usersFolder, internalId)
  }

  getCredentialsPathForUser(internalId) {
    return path.join(this.getFolderForUser(internalId), "credentials.yml")
  }

  async signGot(options, oauthToken) {
    options = {
      method: "POST",
      ...options,
    }
    logger.info("Signing request: %s %s", options.method, options.url)
    const signedOauthRequest = this.client.authorize(options, oauthToken)
    return got(options.url, {
      method: options.method,
      form: options.data,
      headers: this.client.toHeader(signedOauthRequest),
      throwHttpErrors: false,
    })
  }

  async getRequestToken() {
    const requestOptions = {
      url: "https://api.twitter.com/oauth/request_token",
      data: {
        oauth_callback: this.oauthCallback,
      },
    }
    const requestTokenRequest = await this.signGot(requestOptions)
    return requestTokenRequest.body |> queryString.parse
  }

  async tweet(internalId, text) {
    const user = this.getUserByInternalId(internalId)
    if (!user) {
      logger.error("No user found with internalId %s", internalId)
      return
    }
    const token = {
      key: user.oauthToken,
      secret: user.oauthTokenSecret,
    }
    const url = `https://api.twitter.com/1.1/statuses/update.json?${queryString.stringify({
      status: text,
    })}`
    return this.signGot({url}, token)
  }

}

export default new TwitterClient