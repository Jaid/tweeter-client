import joi from "@hapi/joi"
import bufferToDataUrl from "buffer-to-data-url"
import execall from "execall"
import got from "got"
import hasContent, {isEmpty} from "has-content"
import {uniq} from "lodash"

import getQrCodeFromBuffer from "lib/getQrCodeFromBuffer"
import isOnlyLetters from "lib/isOnlyLetters"
import renderPokemonGoQrCode from "lib/renderPokemonGoQrCode"

import ReactionWithCooldown from "src/tweeters/ReactionWithCooldown"

import backgroundBuffer from "./background.png"

export default class extends ReactionWithCooldown {

  static schema = joi.object().keys({
    ...ReactionWithCooldown.baseSchema,
    like: joi.bool(),
    ignoreWithoutLocation: joi.bool(),
    text: joi.string().required(),
  })

  // Working QR code:
  // https://twitter.com/hachx0/status/1226303748844195840

  // Tweet with multiple codes:
  // https://twitter.com/KatibimSerdal/status/1245279187507843073

  async shouldHandleTweet(tweet) {
    const codes = []
    if (hasContent(tweet.extended_entities?.media)) {
      for (const mediaEntry of tweet.extended_entities.media) {
        if (mediaEntry.type !== "photo") {
          continue
        }
        const imageBuffer = await got(mediaEntry.media_url).buffer()
        const qrResult = await getQrCodeFromBuffer(imageBuffer)
        if (!qrResult?.data) {
          continue
        }
        if (!/^\d{12}$/.test(qrResult.data)) {
          continue
        }
        codes.push(qrResult.data)
        tweet.hasQrCode = true
      }
    }
    if (!tweet.hasQrCode) {
      // This pattern is better:
      // /\D((?:\d{4}[ -]?){2}\d{4})(\D|$)/g
      // But does not work with execall because matches would overlap
      const regex = /((?:\d{4}[ -]?){2}\d{4})(\D|$)/g
      const codeMatches = execall(regex, tweet.flattenedText)
      for (const codeMatch of codeMatches) {
        const codeFromText = codeMatch.subMatches[0].replace(/[ -]/g, "")
        codes.push(codeFromText)
      }
    }
    if (isEmpty(codes)) {
      return false
    }
    tweet.codes = uniq(codes)
    tweet.codesFormatted = tweet.codes.map(code => {
      return `${code.slice(0, 4)} ${code.slice(4, 8)} ${code.slice(8, 12)}`
    })
    tweet.codesString = tweet.codesFormatted.join("\n")
    if (hasContent(tweet.user.location)) {
      if (isOnlyLetters(tweet.user.location, " -,")) {
        tweet.playerLocation = tweet.user.location
      } else {
        this.logger.debug(`Discarding Twitter user location: ${tweet.user.location}`)
      }
    }
    if (this.options.ignoreWithoutLocation && !tweet.playerLocation) {
      this.logger.debug("Ignoring tweet, because author does not have a meaningful location set")
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
    if (tweet.hasQrCode) {
      await this.retweet(tweet)
      return
    }
    const text = this.template({
      tweet,
    })
    const renderJobs = tweet.codes.map(async code => {
      const renderedBuffer = await renderPokemonGoQrCode(code, backgroundBuffer)
      const renderedDataUrl = bufferToDataUrl("image/png", renderedBuffer)
      return renderedDataUrl
    })
    const qrCodeImages = await Promise.all(renderJobs)
    const result = await this.post(`${text}\n${tweet.link}`, qrCodeImages)
    await this.registerTargetActionFromTweet(tweet, {
      myTweetId: result.tweet.id_str,
      originalTweetId: tweet.id_str,
      codes: tweet.codes,
    })
  }

}