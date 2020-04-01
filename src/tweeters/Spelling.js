import joi from "@hapi/joi"
import regexParser from "regex-parser"

import Reaction from "src/tweeters/Reaction"

export default class Spelling extends Reaction {

    static schema = joi.object().keys({
      ...Reaction.baseSchema,
    })

    /**
     * @type {import("twit")}
     */
    twit = null

    async start() {
      if (!this.options.reaction) {
        this.logger.warn("Option reaction not given, will default to retweet")
        this.options.reaction = "retweet"
      }
      await super.start()
      this.checkQuotesRegex = regexParser(`/["„“'‚‘]${this.options.track}["„“'‚‘]/i`)
      this.checkLeadingLettersRegex = regexParser(`/\\w${this.options.track}/i`)
      this.checkTrailingLettersRegex = regexParser(`/${this.options.track}\\w/i`)
    }

    async shouldHandleTweet(tweet) {
      if (this.checkLeadingLettersRegex.test(tweet.flattenedText)) {
        this.logger.debug("Found leading letters, skipping (assuming false positive)")
        return false
      }
      if (this.checkTrailingLettersRegex.test(tweet.flattenedText)) {
        this.logger.debug("Found trailing letters, skipping  (assuming false positive)")
        return false
      }
      return true
    }

    async handleTweet(tweet) {
      await this.like(tweet)
      if (this.checkQuotesRegex.test(tweet.flattenedText)) {
        this.logger.debug(`Will not make a tweet assuming author @${tweet.user.screen_name} is not dumb`)
        return
      }
      await super.handleTweet(tweet)
    }

}