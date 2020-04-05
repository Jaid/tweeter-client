import joi from "@hapi/joi"
import regexParser from "regex-parser"

import extendTweet from "lib/extendTweet"

import ReactionWithCooldown from "src/tweeters/ReactionWithCooldown"

export default class Spelling extends ReactionWithCooldown {

    static schema = joi.object().keys({
      ...ReactionWithCooldown.baseSchema,
      like: joi.bool(),
      text: joi.string().required(),
      ignoreTypoReferences: joi.bool().default(true),
      maximumCorrectionsPerUser: joi.number.default(3),
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
      const shouldHandleTweetSuper = await super.shouldHandleTweet(tweet)
      if (!shouldHandleTweetSuper) {
        return false
      }
      return true
    }

    async handleTweet(tweet) {
      if (this.options.like) {
        this.likeDelayed(tweet)
      }
      if (this.options.ignoreTypoReferences) {
        if (tweet.in_reply_to_status_id_str) {
          const parent = await this.getTweetById(tweet.in_reply_to_status_id_str)
          extendTweet(parent)
          const haystackLower = parent.fullText.toLowerCase()
          const needleLower = this.options.track.toLowerCase()
          if (haystackLower.includes(needleLower)) {
            this.logger.debug(`Will not make a tweet assuming author @${tweet.user.screen_name} copied the typo from parent tweet`)
            return
          }
        }
      }
      if (this.checkQuotesRegex.test(tweet.flattenedText)) {
        this.logger.debug(`Will not make a tweet assuming author @${tweet.user.screen_name} is not dumb`)
        return
      }
      const previousCountForThisUser = await ReactionWithCooldown.TargetAction.count({
        where: {
          targetUserId: tweet.user.id_str,
        },
      })
      if (this.options.maximumCorrectionsPerUser) {
        if (previousCountForThisUser >= this.options.maximumCorrectionsPerUser) {
          this.logger.debug(`Not correcting @${tweet.user.screen_name}, because user has already been corrected ${previousCountForThisUser} times`)
          return
        }
      }
      const templateContext = {
        tweet,
        previousCountForThisUser,
      }
      const text = this.template(templateContext)
      const result = await this.retweet(tweet, text)
      if (result?.tweet) {
        await this.registerTargetActionFromTweet(tweet, {
          myTweetId: result.tweet.id_str,
          originalTweetId: tweet.id_str,
        })
      }
    }

}