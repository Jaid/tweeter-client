import joi from "@hapi/joi"
import ensureArray from "ensure-array"
import ensureObject from "ensure-object"
import flattenMultiline from "flatten-multiline"
import handlebars from "handlebars"
import hasContent from "has-content"
import regexParser from "regex-parser"
import Twit from "twit"

import Tweeter from "lib/Tweeter"

export default class extends Tweeter {

    static baseSchema = {
      reaction: joi.any(),
      includeReplies: joi.boolean().default(true),
      track: joi.any(),
      language: joi.any(),
      filter: joi.any(),
      text: joi.string(),
    }

    /**
     * @type {import("twit")}
     */
    twit = null

    async start() {
      if (this.options.text) {
        this.template = handlebars.compile(this.options.text)
      }
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
        tweet.flattenedText = flattenMultiline(tweet.text)
        tweet.link = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
        if (hasContent(tweet.user.name) && !tweet.user.name.includes("@")) {
          tweet.authorTitle = tweet.user.name
        } else {
          tweet.authorTitle = tweet.user.screen_name
        }
        this.logger.debug(`@${tweet.user.screen_name}: ${tweet.flattenedText}`)
        if (!this.options.includeReplies && tweet.in_reply_to_status_id) {
          this.logger.debug("This is a reply, skipping")
          return
        }
        if (this.options.filter) {
          const filters = ensureArray(this.options.filter)
          for (const filter of filters) {
            const filterObject = ensureObject(filter, "ensureRegex")
            if (filterObject.discardRegex && regexParser(filterObject.discardRegex).test(tweet.flattenedText)) {
              this.logger.debug(`Positive test for ${filterObject.discardRegex}, skipping`)
              return
            }
            if (filterObject.ensureRegex && !regexParser(filterObject.ensureRegex).test(tweet.flattenedText)) {
              this.logger.debug(`Negative test for ${filterObject.discardRegex}, skipping`)
              return
            }
          }
        }
        if (this.shouldHandleTweet) {
          let shouldHandle
          try {
            shouldHandle = await this.shouldHandleTweet(tweet)
          } catch (error) {
            console.error(error)
            return
          }
          if (!shouldHandle) {
            return
          }
        }
        const templateContext = {
          tweet,
        }
        await this.reactToTweet(tweet, templateContext)
      })
    }

    async reactToTweet(tweet, templateContext) {
      const tweetId = tweet.id_str
      if (!this.options.reaction) {
        return
      }
      if (this.options.reaction === "tweet" && this.template) {
        await this.post(this.template(templateContext))
      }
      if (this.options.reaction === "retweet") {
        if (this.template) {
          const text = this.template(templateContext)
          await this.post(`${text}\n${tweet.link}`)
        } else {
          if (this.dry) {
            this.logger.info(`statuses/retweet/${tweetId}`)
            return
          }
          await this.twit.post(`statuses/retweet/${tweetId}`)
        }
      }
      if (this.options.reaction === "like") {
        if (this.dry) {
          this.logger.info(`favorites/create ${tweetId}`)
          return
        }
        await this.twit.post("favorites/create", {
          id: tweetId,
        })
      }
      if (this.options.reaction === "reply") {
        if (this.dry) {
          this.logger.info(`reply: ${this.options.text}`)
          return
        }
        await this.twit.post("statuses/update", {
          in_reply_to_status_id: tweetId,
          status: this.options.text,
        })
      }
    }

}