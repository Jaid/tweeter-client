import joi from "@hapi/joi"
import {omit} from "lodash"

import Reaction from "src/tweeters/Reaction"

export default class LikeMentions extends Reaction {

  static schema = joi.object().keys({
    ...omit(Reaction.baseSchema, ["track", "reaction", "text"]),
  })

  async start() {
    this.options.track = `@${this.options.handle}`
    await super.start()
  }

  async handleTweet(tweet) {
    this.like(tweet)
  }

}