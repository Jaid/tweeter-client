import joi from "@hapi/joi"
import got from "got"
import {isEmpty} from "has-content"

import AnimalCrossingFormat from "lib/AnimalCrossingFormat"
import getQrCodeFromBuffer from "lib/getQrCodeFromBuffer"
import isLikelyDesign from "lib/isLikelyDesign"

import Reaction from "src/tweeters/Reaction"

export default class extends Reaction {

  static schema = joi.object().keys({
    ...Reaction.baseSchema,
  })

  // Working QR code:
  // https://twitter.com/borkborkbitch/status/1243853562800566272

  // Randomly found empty QR code:
  // https://twitter.com/Wolfenpilot687/status/1243942699855577090

  async shouldHandleTweet(tweet) {
    if (isEmpty(tweet.extended_entities?.media)) {
      return false
    }
    for (const mediaEntry of tweet.extended_entities.media) {
      if (mediaEntry.type !== "photo") {
        return false
      }
    }
    const designs = []
    for (const mediaEntry of tweet.extended_entities.media) {
      const imageBuffer = await got(mediaEntry.media_url).buffer()
      const qrResult = await getQrCodeFromBuffer(imageBuffer)
      if (qrResult?.binaryData.length !== 620) {
        continue
      }
      let designMeta
      try {
        const design = new AnimalCrossingFormat(qrResult.binaryData)
        designMeta = design.toJson()
      } catch {
        continue
      }
      if (!isLikelyDesign(designMeta)) {
        continue
      }
      designs.push(designMeta)
    }
    if (isEmpty(designs)) {
      return false
    }
    return true
  }

}