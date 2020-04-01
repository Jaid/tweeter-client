import joi from "@hapi/joi"
import dataUrls from "data-urls"
import execall from "execall"
import got from "got"
import hasContent, {isEmpty} from "has-content"
import Jimp from "jimp"
import {uniq} from "lodash"
import qrcode from "qrcode"

import getQrCodeFromBuffer from "lib/getQrCodeFromBuffer"
import isOnlyLetters from "lib/isOnlyLetters"

import Reaction from "src/tweeters/Reaction"

export default class extends Reaction {

  static schema = joi.object().keys({
    ...Reaction.baseSchema,
    like: joi.bool().default(true),
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
    return true
  }

  async handleTweet(tweet) {
    if (this.options.like) {
      await this.like(tweet)
    }
    if (tweet.hasQrCode) {
      await this.retweet(tweet)
      return
    }
    const text = this.template({
      tweet,
    })
    const renderJobs = tweet.codes.map(async code => {
      const qrUrl = await qrcode.toDataURL(code, {
        errorCorrectionLevel: "L",
        scale: 32,
      })
      const qrBuffer = dataUrls(qrUrl).body
      const qrJimp = await Jimp.create(qrBuffer)
      qrJimp.background(0xFFFFFFFF)
      qrJimp.contain(1920, 1080)
      return qrJimp.getBase64Async(Jimp.MIME_PNG)
    })
    const qrCodeImages = await Promise.all(renderJobs)
    await this.post(`${text}\n${tweet.link}`, qrCodeImages)
  }

}