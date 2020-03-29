import joi from "@hapi/joi"
import dataUrls from "data-urls"
import got from "got"
import hasContent, {isEmpty} from "has-content"
import Jimp from "jimp"
import qrcode from "qrcode"

import getQrCodeFromBuffer from "lib/getQrCodeFromBuffer"
import isOnlyLetters from "lib/isOnlyLetters"

import Reaction from "src/tweeters/Reaction"

export default class extends Reaction {

  static displayName = "PokemonGoQrCodes"

  static schema = joi.object().keys({
    ...Reaction.baseSchema,
  })

  // Working QR code:
  // https://twitter.com/hachx0/status/1226303748844195840

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
      const codeFromTextMatch = /(?<code>(?:\d{4}[ -]?){2}\d{4})/.exec(tweet.flattenedText)
      if (codeFromTextMatch?.groups.code) {
        const codeFromText = codeFromTextMatch.groups.code.replace(/[ -]/g, "")
        this.logger.debug(`Extracted code: ${codeFromText}`)
        codes.push(codeFromText)
      }
    }
    if (isEmpty(codes)) {
      return false
    }
    tweet.codes = codes
    tweet.codesFormatted = codes.map(code => {
      return `${code.slice(0, 4)} ${code.slice(4, 8)} ${code.slice(8, 12)}`
    })
    tweet.codesString = tweet.codesFormatted.join("\n")
    if (hasContent(tweet.user.location) && isOnlyLetters(tweet.user.location.replace(",", ""))) {
      tweet.playerLocation = tweet.user.location
    }
    return true
  }

  async handleTweet(tweet) {
    if (tweet.hasQrCode) {
      await super.handleTweet(tweet)
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