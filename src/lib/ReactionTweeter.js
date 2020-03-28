import joi from "@hapi/joi"
import Twit from "twit"

import Tweeter from "lib/Tweeter"

export default class extends Tweeter {

    static baseSchema = {
      reaction: joi.any(),
      includeReplies: joi.boolean().default(true),
      track: joi.any(),
      language: joi.any(),
    }

    /**
     * @type {import("twit")}
     */
    twit = null

    async start() {
      const twitCredentials = await Tweeter.apiGot("credentials", {
        json: {
          handle: this.handle,
        },
      }).json()
      this.twit = new Twit(twitCredentials)
      const streamOptions = {}
      if (this.options.track) {
        streamOptions.track = this.options.track
      }
      if (this.options.language) {
        streamOptions.language = this.options.language
      }
      const stream = this.twit.stream("statuses/filter", streamOptions)
      stream.on("tweet", async tweet => {
        if (tweet.retweeted_status) {
          return
        }
        if (!this.options.includeReplies && tweet.in_reply_to_status_id) {
          return
        }
        if (this.shouldHandleTweet) {
          const shouldHandle = await this.shouldHandleTweet(tweet)
          if (!shouldHandle) {
            return
          }
        }
        await this.reactToTweet(tweet.id_str)
      })
    }

    async reactToTweet(tweetId) {
      if (!this.options.reaction) {
        return
      }
      if (this.options.reaction === "retweet") {
        await this.twit.post(`statuses/retweet/${tweetId}`)
      }
    }

}