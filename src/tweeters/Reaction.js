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
        this.template = handlebars.compile(this.options.text, {noEscape: true})
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
        tweet.fullText = tweet.extended_tweet?.full_text || tweet.text
        tweet.flattenedText = flattenMultiline(tweet.fullText)
        tweet.shortLink = `twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
        tweet.link = `https://${tweet.shortLink}`
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
            this.logger.debug("Skipped by shouldHandleTweet")
            return
          }
        }
        await this.handleTweet(tweet)
      })
    }

    async handleTweet(tweet) {
      const templateContext = {
        tweet,
      }
      await this.reactToTweet(tweet, templateContext)
    }

    async like(tweet) {
      if (this.dry) {
        this.logger.info(`Like ${tweet.shortLink}`)
        return
      }
      await this.twit.post("favorites/create", {
        id: tweet.id_str,
      })
    }

    async reply(tweet, text) {
      if (this.dry) {
        this.logger.info(`Reply to ${tweet.shortLink}: ${text}`)
        return
      }
      await this.twit.post("statuses/update", {
        in_reply_to_status_id: tweet.id_str,
        status: this.options.text,
      })
    }

    async retweet(tweet) {
      if (this.dry) {
        this.logger.info(`Retweet ${tweet.shortLink}`)
        return
      }
      await this.twit.post(`statuses/retweet/${tweet.id_str}`)
    }

    async reactToTweet(tweet, templateContext) {
      if (!this.options.reaction) {
        return
      }
      if (this.options.reaction === "tweet" && this.template) {
        const text = this.template(templateContext)
        await this.post(text)
      }
      if (this.options.reaction === "retweet") {
        if (this.template) {
          const text = this.template(templateContext)
          await this.post(`${text}\n${tweet.link}`)
        } else {
          await this.retweet(tweet)
        }
      }
      if (this.options.reaction === "like") {
        await this.like(tweet)
      }
      if (this.options.reaction === "reply") {
        const text = this.template(templateContext)
        await this.reply(tweet, text)
      }
    }

}