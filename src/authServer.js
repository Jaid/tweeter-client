import path from "path"

import express from "express"
import Handlebars from "handlebars"
import config from "lib/config"
import logger from "lib/logger"
import queryString from "query-string"
import fsp from "@absolunet/fsp"
import app from "lib/app"

import twitterClient from "./twitterClient"

const generateHtml = Handlebars.compile("<a href='https://api.twitter.com/oauth/authenticate?oauth_token={{requestToken.oauth_token}}'>Login with Twitter</a>")

class AuthServer {

  async init() {
    app.get("/login", async (request, response) => {
      const requestToken = await twitterClient.getRequestToken()
      if (!requestToken?.oauth_token) {
        logger.error("Could not retrieve a token")
        response.send("Error")
        return
      }
      response.send(generateHtml({requestToken}))
    })
    app.get("/callback", async (request, response) => {
      logger.debug("Calling /callback")
      const oauthToken = request.query.oauth_token
      const oauthVerifier = request.query.oauth_verifier
      const gotResponse = await twitterClient.signGot({
        url: "https://api.twitter.com/oauth/access_token",
        data: {
          oauth_token: oauthToken,
          oauth_verifier: oauthVerifier,
        },
      })
      const responseBody = gotResponse.body |> queryString.parse
      const internalId = responseBody.screen_name.toLowerCase()
      const outputPath = twitterClient.getCredentialsPathForUser(internalId)
      logger.info("Saving new credentials of %s to %s", responseBody.screen_name, outputPath)
      await fsp.outputYaml(outputPath, {
        internalId,
        id: responseBody.user_id,
        handle: responseBody.screen_name,
        oauthToken: responseBody.oauth_token,
        oauthTokenSecret: responseBody.oauth_token_secret,
      })
      response.redirect("/done")
    })
    app.get("/done", (request, response) => {
      response.send("Done.")
    })
    logger.info("Started authServer")
  }

}

export default new AuthServer