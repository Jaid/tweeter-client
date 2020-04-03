import joi from "@hapi/joi"
import regexParser from "regex-parser"

import Reaction from "src/tweeters/Reaction"

export default class Spelling extends Reaction {

    static schema = joi.object().keys({
      ...Reaction.baseSchema,
      like: joi.bool(),
      text: joi.string().required(),
    })

    async start() {
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
      if (this.options.like) {
        this.likeDelayed(tweet)
      }
      if (this.checkQuotesRegex.test(tweet.flattenedText)) {
        this.logger.debug(`Will not make a tweet assuming author @${tweet.user.screen_name} is not dumb`)
        return
      }
      const templateContext = {
        tweet,
      }
      const text = this.template(templateContext)
      await this.retweet(tweet, text)
    }

}