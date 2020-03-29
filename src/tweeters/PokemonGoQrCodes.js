import joi from "@hapi/joi"
import got from "got"
import {isEmpty} from "has-content"

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
    }
    if (isEmpty(codes)) {
      return false
    }
    tweet.codes = codes.map(code => {
      return `${code.slice(0, 4)} ${code.slice(4, 8)} ${code.slice(8, 12)}`
    })
    tweet.codesString = tweet.codes.split("\n")
    return true
  }

}