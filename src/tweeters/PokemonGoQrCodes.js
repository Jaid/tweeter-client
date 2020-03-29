import joi from "@hapi/joi"
import got from "got"
import {isEmpty} from "has-content"
import qrcode from "qrcode"

import getQrCodeFromBuffer from "lib/getQrCodeFromBuffer"

import Reaction from "src/tweeters/Reaction"

export default class extends Reaction {

  static displayName = "PokemonGoQrCodes"

  static schema = joi.object().keys({
    ...Reaction.baseSchema,
  })

  // Working QR code:
  // https://twitter.com/hachx0/status/1226303748844195840

  async shouldHandleTweet(tweet) {
    if (isEmpty(tweet.extended_entities?.media)) {
      return false
    }
    for (const mediaEntry of tweet.extended_entities.media) {
      if (mediaEntry.type !== "photo") {
        return false
      }
    }
    const codes = []
    for (const mediaEntry of tweet.extended_entities.media) {
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
    if (!tweet.hasQrCode) {
      const codeFromText = /(?<code>(?:\d{4}[ -]?){2}\d{4})/.exec(tweet.flattenedText)
      if (codeFromText?.groups?.code) {
        const codeFromTextNormalized = codeFromText.groups.code.replace(/[ -]/g, "")
        this.logger.debug(`Extracted code: ${codeFromTextNormalized}`)
        codes.push(codeFromTextNormalized)
      }
    }
    if (isEmpty(codes)) {
      return false
    }
    tweet.codes = codes
    tweet.codesFormatted = codes.map(code => {
      return `${code.slice(0, 4)} ${code.slice(4, 8)} ${code.slice(8, 12)}`
    })
    tweet.codesString = tweet.codesFormatted.split("\n")
    return true
  }

  async handleTweet(tweet) {
    if (tweet.hasQrCode) {
      await super.handleTweet(tweet)
      return
    }
    const text = this.template(templateContext)
    const qrCode = await qrcode.toDataURL()
    await this.post(`abc\n${tweet.codeString}`, qrCode)
  }

}