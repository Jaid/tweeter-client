import joi from "@hapi/joi"

import Reaction from "src/tweeters/Reaction"

export default class LikeMentions extends Reaction {

  static schema = joi.object().keys({
    ...Reaction.baseSchema,
  })

  async start() {
    this.options.track = `@${this.options.handle}`
    await super.start()
  }

  async handleTweet(tweet) {
    this.likeDelayed(tweet)
  }

}