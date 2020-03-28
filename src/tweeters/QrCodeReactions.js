import joi from "@hapi/joi"
import got from "got"
import {isEmpty} from "has-content"

import getQrCodeFromBuffer from "lib/getQrCodeFromBuffer"
import ReactionTweeter from "lib/ReactionTweeter"

export default class extends ReactionTweeter {

  static displayName = "RetweetQrCodes"

  static schema = joi.object().keys({
    ...ReactionTweeter.baseSchema,
  })

  // Working QR code:
  // https://twitter.com/borkborkbitch/status/1243853562800566272

  async shouldHandleTweet(tweet) {
    if (isEmpty(tweet.extended_entities?.media)) {
      console.log(`No media in: https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
      return false
    }
    for (const mediaEntry of tweet.extended_entities.media) {
      if (mediaEntry.type !== "photo") {
        return false
      }
    }
    const qrCodes = []
    for (const mediaEntry of tweet.extended_entities.media) {
      const imageBuffer = await got(mediaEntry.media_url).buffer()
      const qrResult = await getQrCodeFromBuffer(imageBuffer)
      if (qrResult) {
        qrCodes.push(qrResult)
      }
    }
    if (isEmpty(qrCodes)) {
      console.log(`No QR codes in: https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
      return false
    }
    return true
  }

}